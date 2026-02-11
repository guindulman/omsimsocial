<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateMessageRequest;
use App\Http\Resources\MessageResource;
use App\Events\MessageSent;
use App\Models\Message;
use App\Models\User;
use App\Services\ConnectionService;
use App\Services\FriendshipService;
use App\Services\Moderation\ImageModerationService;
use App\Models\UserE2eeKey;
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
            'sender_id' => $sender->id,
            'recipient_id' => $recipientId,
            'body' => $body,
            'media_url' => $mediaUrl,
            'media_type' => $mediaType,
            ...$e2eeFields,
        ]);

        $message->load(['sender.profile', 'recipient.profile']);

        broadcast(new MessageSent($message))->toOthers();

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

        $markedRead = Message::query()
            ->where('sender_id', $user->id)
            ->where('recipient_id', $viewer->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $messages = Message::query()
            ->with(['sender.profile', 'recipient.profile'])
            ->where(function ($query) use ($viewer, $user) {
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
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'data' => MessageResource::collection($messages),
            'marked_read' => $markedRead,
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
}
