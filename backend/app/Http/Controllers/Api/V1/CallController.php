<?php

namespace App\Http\Controllers\Api\V1;

use App\Events\CallSignalSent;
use App\Http\Controllers\Controller;
use App\Http\Resources\CallSessionResource;
use App\Models\CallSession;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Services\ConnectionService;
use App\Services\FriendshipService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CallController extends Controller
{
    public function request(
        Request $request,
        FriendshipService $friendshipService,
        ConnectionService $connectionService
    ) {
        $data = $request->validate([
            'recipient_id' => ['required', 'integer', 'exists:users,id'],
            'type' => ['nullable', Rule::in(['voice', 'video'])],
        ]);

        $user = $request->user();
        $recipientId = (int) $data['recipient_id'];

        if ($recipientId === $user->id) {
            return response()->json([
                'message' => 'You cannot call yourself.',
            ], 422);
        }

        if (! $friendshipService->exists($user->id, $recipientId)) {
            return response()->json([
                'message' => 'Calls are available only between friends.',
            ], 403);
        }

        if ($connectionService->isBlocked($user->id, $recipientId)) {
            return response()->json([
                'message' => 'Calls are blocked between these users.',
            ], 403);
        }

        $conversation = $this->resolveConversation($user->id, $recipientId);

        $call = CallSession::query()->create([
            'conversation_id' => $conversation->id,
            'requested_by_user_id' => $user->id,
            'type' => $data['type'] ?? 'video',
            'status' => 'requested',
            'expires_at' => now()->addMinutes(2),
            'started_at' => null,
            'ended_at' => null,
        ]);

        $payload = [
            'call' => CallSessionResource::make($call)->resolve(),
        ];

        broadcast(new CallSignalSent($call->id, $user->id, $recipientId, 'request', $payload))->toOthers();

        return response()->json([
            'call' => CallSessionResource::make($call),
        ], 201);
    }

    public function accept(Request $request, CallSession $call)
    {
        $user = $request->user();
        $otherId = $this->resolveOtherParticipant($call, $user->id);

        if (! $otherId) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        if ($call->status !== 'accepted') {
            $call->update([
                'status' => 'accepted',
                'started_at' => now(),
            ]);
        }

        $payload = [
            'call' => CallSessionResource::make($call)->resolve(),
        ];

        broadcast(new CallSignalSent($call->id, $user->id, $otherId, 'accept', $payload))->toOthers();

        return response()->json([
            'call' => CallSessionResource::make($call),
        ]);
    }

    public function decline(Request $request, CallSession $call)
    {
        $user = $request->user();
        $otherId = $this->resolveOtherParticipant($call, $user->id);

        if (! $otherId) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $call->update([
            'status' => 'declined',
            'ended_at' => now(),
        ]);

        $payload = [
            'call' => CallSessionResource::make($call)->resolve(),
        ];

        broadcast(new CallSignalSent($call->id, $user->id, $otherId, 'decline', $payload))->toOthers();

        return response()->json([
            'call' => CallSessionResource::make($call),
        ]);
    }

    public function end(Request $request, CallSession $call)
    {
        $user = $request->user();
        $otherId = $this->resolveOtherParticipant($call, $user->id);

        if (! $otherId) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $call->update([
            'status' => 'ended',
            'ended_at' => now(),
        ]);

        $payload = [
            'call' => CallSessionResource::make($call)->resolve(),
        ];

        broadcast(new CallSignalSent($call->id, $user->id, $otherId, 'end', $payload))->toOthers();

        return response()->json([
            'call' => CallSessionResource::make($call),
        ]);
    }

    public function signal(Request $request, CallSession $call)
    {
        $data = $request->validate([
            'signal' => ['required', 'array'],
        ]);

        $user = $request->user();
        $otherId = $this->resolveOtherParticipant($call, $user->id);

        if (! $otherId) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        broadcast(new CallSignalSent($call->id, $user->id, $otherId, 'signal', [
            'signal' => $data['signal'],
        ]))->toOthers();

        return response()->json(['ok' => true]);
    }

    protected function resolveConversation(int $userId, int $recipientId): Conversation
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

        if ($conversation) {
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

    protected function resolveOtherParticipant(CallSession $call, int $userId): ?int
    {
        $call->loadMissing('conversation.participants');
        $conversation = $call->conversation;

        if (! $conversation || ! $conversation->participants->contains('user_id', $userId)) {
            return null;
        }

        $other = $conversation->participants->firstWhere('user_id', '!=', $userId);

        return $other?->user_id;
    }
}
