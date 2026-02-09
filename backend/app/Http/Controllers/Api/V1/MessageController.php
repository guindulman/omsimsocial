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
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function store(CreateMessageRequest $request, FriendshipService $friendshipService, ConnectionService $connectionService, ImageModerationService $moderation)
    {
        $sender = $request->user();
        $recipientId = $request->integer('recipient_id');

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

        $mediaUrl = null;
        $mediaType = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $mimeType = $file->getMimeType() ?? '';
            $mediaType = str_starts_with($mimeType, 'video') ? 'video' : 'image';

            if ($mediaType === 'image') {
                $decision = $moderation->moderate($file);
                if (! ($decision['allowed'] ?? false)) {
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

        $message = Message::query()->create([
            'sender_id' => $sender->id,
            'recipient_id' => $recipientId,
            'body' => $request->input('body') ?? '',
            'media_url' => $mediaUrl,
            'media_type' => $mediaType,
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
}
