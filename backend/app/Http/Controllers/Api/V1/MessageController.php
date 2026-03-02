<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\MessageCreated;
use App\Events\MessageRead as MessageReadEvent;
use App\Events\MessageReactionUpdated;
use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMessageRequest;
use App\Http\Resources\MessageResource;
use App\Http\Resources\UserResource;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\MessageReaction;
use App\Models\User;
use App\Models\UserE2eeKey;
use App\Services\ConnectionService;
use App\Services\FriendshipService;
use App\Services\Moderation\ImageModerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function store(CreateMessageRequest $request, FriendshipService $friendshipService, ConnectionService $connectionService, ImageModerationService $moderation)
    {
        $sender = $request->user();
        $recipientId = $request->integer('recipient_id');
        $e2eeEnabled = (bool) config('e2ee.enabled');
        $e2eeRequired = (bool) config('e2ee.required');
        $e2ee = $request->input('e2ee');
        $isE2eeMessage = $e2eeEnabled && is_array($e2ee);

        if (! $friendshipService->exists($sender->id, $recipientId)) {
            return response()->json([
                'code' => 'messaging_requires_friendship',
                'message' => 'Messaging allowed only between friends.',
            ], 403);
        }

        if ($connectionService->isBlocked($sender->id, $recipientId)) {
            return response()->json([
                'code' => 'messaging_blocked',
                'message' => 'Messaging blocked.',
            ], 403);
        }

        $conversation = $this->resolveConversation($sender->id, $recipientId, true);

        $senderKey = null;
        $recipientKey = null;
        if ($e2eeEnabled && ($e2eeRequired || $isE2eeMessage)) {
            $senderKey = UserE2eeKey::query()->where('user_id', $sender->id)->first();
            $recipientKey = UserE2eeKey::query()->where('user_id', $recipientId)->first();

            if (! $senderKey || ! $recipientKey) {
                return response()->json([
                    'code' => 'e2ee_not_configured',
                    'message' => 'End-to-end encryption is enabled but one or both users do not have keys configured.',
                ], 409);
            }

            // For privacy, do not accept plaintext DM bodies when E2EE is required.
            if ($e2eeRequired && is_string($request->input('body'))) {
                return response()->json([
                    'code' => 'e2ee_required',
                    'message' => 'End-to-end encryption is required for direct message text.',
                ], 422);
            }
        }

        $mediaUrl = null;
        $mediaType = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $mimeType = $file->getMimeType() ?? '';
            $mediaType = str_starts_with($mimeType, 'video') ? 'video' : 'image';

            if ($mediaType === 'image') {
                $decision = $moderation->moderate($file);
                if (! ($decision['allowed'] ?? false) && ! $this->shouldBypassModerationFailure($decision)) {
                    return response()->json([
                        'code' => $decision['code'] ?? 'explicit_content_blocked',
                        'message' => $decision['message'] ?? 'Upload rejected.',
                    ], 422);
                }
            }

            $path = $file->storePublicly('messages/'.$sender->id, [
                'disk' => 'public',
            ]);
            $mediaUrl = Storage::disk('public')->url($path);
        }

        $body = $request->input('body') ?? '';
        $e2eeFields = [];
        if ($isE2eeMessage) {
            $senderPublicKey = $e2ee['sender_public_key'] ?? null;
            if (! is_string($senderPublicKey) || ! $senderKey || $senderPublicKey !== $senderKey->public_key) {
                return response()->json([
                    'code' => 'e2ee_sender_key_mismatch',
                    'message' => 'Invalid end-to-end encryption sender key.',
                ], 422);
            }

            $body = '';
            $e2eeFields = [
                'body_e2ee_version' => (int) ($e2ee['v'] ?? 1),
                'body_e2ee_sender_public_key' => $senderPublicKey,
                'body_ciphertext_sender' => (string) ($e2ee['ciphertext_sender'] ?? ''),
                'body_nonce_sender' => (string) ($e2ee['nonce_sender'] ?? ''),
                'body_ciphertext_recipient' => (string) ($e2ee['ciphertext_recipient'] ?? ''),
                'body_nonce_recipient' => (string) ($e2ee['nonce_recipient'] ?? ''),
            ];
        }

        $message = Message::query()->create([
            'conversation_id' => $conversation?->id,
            'sender_id' => $sender->id,
            'recipient_id' => $recipientId,
            'body' => $body,
            'media_url' => $mediaUrl,
            'media_type' => $mediaType,
            'delivered_at' => now(),
            ...$e2eeFields,
        ]);

        $message->load(['sender.profile', 'recipient.profile', 'reactions']);

        broadcast(new MessageSent($message))->toOthers();
        broadcast(new MessageCreated($message))->toOthers();

        return response()->json([
            'message' => MessageResource::make($message),
        ], 201);
    }

    public function thread(Request $request, User $user, FriendshipService $friendshipService, ConnectionService $connectionService)
    {
        $viewer = $request->user();

        if (! $friendshipService->exists($viewer->id, $user->id)) {
            return response()->json([
                'code' => 'messaging_requires_friendship',
                'message' => 'Messaging allowed only between friends.',
            ], 403);
        }

        if ($connectionService->isBlocked($viewer->id, $user->id)) {
            return response()->json([
                'code' => 'messaging_blocked',
                'message' => 'Messaging blocked.',
            ], 403);
        }

        $payload = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'before_id' => ['nullable', 'integer', 'min:1'],
        ]);

        $limit = (int) ($payload['limit'] ?? 50);
        $beforeId = isset($payload['before_id']) ? (int) $payload['before_id'] : null;

        [$markedRead, $markedIds, $readAt, $readConversationId] = $this->markUnreadMessagesAsRead($viewer, $user);

        $conversation = $this->resolveConversation($viewer->id, $user->id, false);

        $query = Message::query()
            ->with(['sender.profile', 'recipient.profile', 'reactions'])
            ->where(function ($query) use ($conversation, $viewer, $user) {
                if ($conversation) {
                    $query->where('conversation_id', $conversation->id)
                        ->orWhere(function ($fallback) use ($viewer, $user) {
                            $fallback->whereNull('conversation_id')
                                ->where(function ($pair) use ($viewer, $user) {
                                    $pair->where(function ($sub) use ($viewer, $user) {
                                        $sub->where('sender_id', $viewer->id)
                                            ->where('recipient_id', $user->id);
                                    })
                                    ->orWhere(function ($sub) use ($viewer, $user) {
                                        $sub->where('sender_id', $user->id)
                                            ->where('recipient_id', $viewer->id);
                                    });
                                });
                        });

                    return;
                }

                $query->where(function ($sub) use ($viewer, $user) {
                    $sub->where('sender_id', $viewer->id)
                        ->where('recipient_id', $user->id);
                })
                ->orWhere(function ($sub) use ($viewer, $user) {
                    $sub->where('sender_id', $user->id)
                        ->where('recipient_id', $viewer->id);
                });
            })
            ->where(function ($query) use ($viewer) {
                $query->where(function ($sub) use ($viewer) {
                    $sub->where('sender_id', $viewer->id)
                        ->whereNull('deleted_for_sender_at');
                })
                ->orWhere(function ($sub) use ($viewer) {
                    $sub->where('recipient_id', $viewer->id)
                        ->whereNull('deleted_for_recipient_at');
                });
            })
            ->when($beforeId, fn ($builder) => $builder->where('id', '<', $beforeId))
            ->orderByDesc('id')
            ->limit($limit + 1);

        $chunk = $query->get();
        $hasMore = $chunk->count() > $limit;
        $messages = $chunk
            ->take($limit)
            ->sortBy('id')
            ->values();

        return response()->json([
            'data' => MessageResource::collection($messages),
            'marked_read' => $markedRead,
            'marked_message_ids' => $markedIds,
            'marked_read_at' => $readAt,
            'pagination' => [
                'has_more' => $hasMore,
                'next_before_id' => $hasMore ? $messages->first()?->id : null,
                'limit' => $limit,
            ],
            'conversation_id' => $conversation?->id ?? $readConversationId,
        ]);
    }

    public function markThreadRead(Request $request, User $user, FriendshipService $friendshipService, ConnectionService $connectionService)
    {
        $viewer = $request->user();

        if (! $friendshipService->exists($viewer->id, $user->id)) {
            return response()->json([
                'code' => 'messaging_requires_friendship',
                'message' => 'Messaging allowed only between friends.',
            ], 403);
        }

        if ($connectionService->isBlocked($viewer->id, $user->id)) {
            return response()->json([
                'code' => 'messaging_blocked',
                'message' => 'Messaging blocked.',
            ], 403);
        }

        [$markedRead, $markedIds, $readAt, $conversationId] = $this->markUnreadMessagesAsRead($viewer, $user);

        return response()->json([
            'marked_read' => $markedRead,
            'marked_message_ids' => $markedIds,
            'marked_read_at' => $readAt,
            'conversation_id' => $conversationId,
        ]);
    }

    public function conversations(Request $request)
    {
        $viewer = $request->user();

        $payload = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
            'cursor' => ['nullable', 'integer', 'min:1'],
        ]);

        $limit = (int) ($payload['limit'] ?? 20);
        $cursor = isset($payload['cursor']) ? (int) $payload['cursor'] : null;
        $viewerId = (int) $viewer->id;

        $counterpartExpression = 'CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END';

        $threadRows = Message::query()
            ->selectRaw($counterpartExpression.' as counterpart_id', [$viewerId])
            ->selectRaw('MAX(id) as last_message_id')
            ->where(function ($query) use ($viewerId) {
                $query->where('sender_id', $viewerId)
                    ->orWhere('recipient_id', $viewerId);
            })
            ->where(function ($query) use ($viewerId) {
                $query->where(function ($sub) use ($viewerId) {
                    $sub->where('sender_id', $viewerId)
                        ->whereNull('deleted_for_sender_at');
                })
                ->orWhere(function ($sub) use ($viewerId) {
                    $sub->where('recipient_id', $viewerId)
                        ->whereNull('deleted_for_recipient_at');
                });
            })
            ->groupByRaw($counterpartExpression, [$viewerId])
            ->when($cursor, fn ($builder) => $builder->havingRaw('MAX(id) < ?', [$cursor]))
            ->orderByDesc('last_message_id')
            ->limit($limit + 1)
            ->get();

        $hasMore = $threadRows->count() > $limit;
        $trimmedRows = $threadRows->take($limit)->values();

        $lastMessageIds = $trimmedRows->pluck('last_message_id')->map(fn ($id) => (int) $id)->values();
        $counterpartIds = $trimmedRows->pluck('counterpart_id')->map(fn ($id) => (int) $id)->values();

        $messagesById = Message::query()
            ->whereIn('id', $lastMessageIds)
            ->with(['sender.profile', 'recipient.profile', 'reactions'])
            ->get()
            ->keyBy('id');

        $usersById = User::query()
            ->whereIn('id', $counterpartIds)
            ->with('profile')
            ->get()
            ->keyBy('id');

        $unreadBySender = Message::query()
            ->select('sender_id')
            ->selectRaw('COUNT(*) as unread_count')
            ->where('recipient_id', $viewerId)
            ->whereNull('read_at')
            ->whereNull('deleted_for_recipient_at')
            ->whereIn('sender_id', $counterpartIds)
            ->groupBy('sender_id')
            ->get()
            ->keyBy('sender_id');

        $data = $trimmedRows->map(function ($row) use ($messagesById, $usersById, $unreadBySender) {
            $lastMessageId = (int) $row->last_message_id;
            $counterpartId = (int) $row->counterpart_id;
            $message = $messagesById->get($lastMessageId);
            $counterpart = $usersById->get($counterpartId);
            $unreadCount = (int) ($unreadBySender->get($counterpartId)->unread_count ?? 0);

            return [
                'counterpart_id' => $counterpartId,
                'conversation_id' => $message?->conversation_id,
                'user' => $counterpart ? UserResource::make($counterpart)->resolve() : null,
                'last_message' => $message ? MessageResource::make($message)->resolve() : null,
                'unread_count' => $unreadCount,
            ];
        })->values();

        return response()->json([
            'data' => $data,
            'pagination' => [
                'has_more' => $hasMore,
                'next_cursor' => $hasMore ? (int) ($trimmedRows->last()->last_message_id ?? 0) : null,
                'limit' => $limit,
            ],
        ]);
    }

    public function react(Request $request, Message $message)
    {
        $viewer = $request->user();
        $this->ensureCanAccessMessage($viewer, $message);

        $payload = $request->validate([
            'reaction' => ['required', 'string', 'max:32'],
        ]);

        $reaction = MessageReaction::query()->updateOrCreate(
            [
                'message_id' => $message->id,
                'user_id' => $viewer->id,
            ],
            [
                'reaction' => trim($payload['reaction']),
            ]
        );

        $message->load(['sender.profile', 'recipient.profile', 'reactions']);

        broadcast(new MessageReactionUpdated($message, $reaction, 'updated', $viewer->id))->toOthers();

        return response()->json([
            'message' => MessageResource::make($message),
        ]);
    }

    public function unreact(Request $request, Message $message)
    {
        $viewer = $request->user();
        $this->ensureCanAccessMessage($viewer, $message);

        $reaction = MessageReaction::query()
            ->where('message_id', $message->id)
            ->where('user_id', $viewer->id)
            ->first();

        if ($reaction) {
            $reaction->delete();
        }

        $message->load(['sender.profile', 'recipient.profile', 'reactions']);

        broadcast(new MessageReactionUpdated($message, $reaction, 'removed', $viewer->id))->toOthers();

        return response()->json([
            'message' => MessageResource::make($message),
        ]);
    }

    public function destroy(Request $request, Message $message)
    {
        $viewer = $request->user();

        if ($message->sender_id !== $viewer->id && $message->recipient_id !== $viewer->id) {
            return response()->json([
                'message' => 'Not authorized.',
            ], 403);
        }

        if ($message->sender_id === $viewer->id) {
            $message->deleted_for_sender_at = now();
        }

        if ($message->recipient_id === $viewer->id) {
            $message->deleted_for_recipient_at = now();
        }

        $message->save();

        return response()->json(['ok' => true]);
    }

    public function unsend(Request $request, Message $message)
    {
        $viewer = $request->user();

        if ($message->sender_id !== $viewer->id) {
            return response()->json([
                'message' => 'Not authorized.',
            ], 403);
        }

        $message->deleted_for_sender_at = now();
        $message->deleted_for_recipient_at = now();
        $message->save();

        return response()->json(['ok' => true]);
    }

    public function unreadCount(Request $request)
    {
        $count = Message::query()
            ->where('recipient_id', $request->user()->id)
            ->whereNull('read_at')
            ->whereNull('deleted_for_recipient_at')
            ->count();

        return response()->json([
            'total' => $count,
        ]);
    }

    public function unreadBySender(Request $request)
    {
        $rows = Message::query()
            ->select('sender_id')
            ->selectRaw('COUNT(*) as unread_count')
            ->where('recipient_id', $request->user()->id)
            ->whereNull('read_at')
            ->whereNull('deleted_for_recipient_at')
            ->groupBy('sender_id')
            ->get();

        $data = $rows->map(function ($row) {
            return [
                'sender_id' => $row->sender_id,
                'unread_count' => (int) $row->unread_count,
            ];
        });

        return response()->json([
            'data' => $data,
        ]);
    }

    /**
     * Allow image uploads to proceed when moderation infrastructure is unavailable.
     * Explicit-content decisions remain blocking.
     *
     * @param  array<string, mixed>  $decision
     */
    private function shouldBypassModerationFailure(array $decision): bool
    {
        $code = $decision['code'] ?? null;

        return in_array($code, [
            'moderation_unavailable',
            'moderation_not_configured',
        ], true);
    }

    private function resolveConversation(int $userId, int $recipientId, bool $createIfMissing = false): ?Conversation
    {
        $conversation = Conversation::query()
            ->where('type', 'direct')
            ->whereHas('participants', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->whereHas('participants', function ($query) use ($recipientId) {
                $query->where('user_id', $recipientId);
            })
            ->first();

        if ($conversation || ! $createIfMissing) {
            return $conversation;
        }

        $conversation = Conversation::query()->create([
            'type' => 'direct',
        ]);

        ConversationParticipant::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $userId,
        ]);

        ConversationParticipant::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $recipientId,
        ]);

        return $conversation;
    }

    /**
     * @return array{0:int,1:array<int,int>,2:?string,3:?int}
     */
    private function markUnreadMessagesAsRead(User $viewer, User $other): array
    {
        $query = Message::query()
            ->where('sender_id', $other->id)
            ->where('recipient_id', $viewer->id)
            ->whereNull('read_at')
            ->whereNull('deleted_for_recipient_at');

        $messageIds = (clone $query)->pluck('id')->map(fn ($id) => (int) $id)->values()->all();

        if ($messageIds === []) {
            return [0, [], null, $this->resolveConversation($viewer->id, $other->id, false)?->id];
        }

        $readAt = now();
        $markedRead = (clone $query)->update(['read_at' => $readAt]);

        $conversationId = Message::query()
            ->whereIn('id', $messageIds)
            ->whereNotNull('conversation_id')
            ->value('conversation_id');

        if (! $conversationId) {
            $conversationId = $this->resolveConversation($viewer->id, $other->id, false)?->id;
        }

        broadcast(new MessageReadEvent(
            $viewer->id,
            $other->id,
            $conversationId ? (int) $conversationId : null,
            $messageIds,
            $readAt->toISOString()
        ))->toOthers();

        return [$markedRead, $messageIds, $readAt->toISOString(), $conversationId ? (int) $conversationId : null];
    }

    private function ensureCanAccessMessage(User $viewer, Message $message): void
    {
        $isParticipant = $message->sender_id === $viewer->id || $message->recipient_id === $viewer->id;
        $isDeletedForViewer = ($message->sender_id === $viewer->id && ! is_null($message->deleted_for_sender_at))
            || ($message->recipient_id === $viewer->id && ! is_null($message->deleted_for_recipient_at));

        abort_if(! $isParticipant || $isDeletedForViewer, 404, 'Message not found.');
    }
}
