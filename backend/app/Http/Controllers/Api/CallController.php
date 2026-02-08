<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CallRequest;
use App\Http\Resources\CallSessionResource;
use App\Models\CallSession;
use App\Models\Conversation;
use App\Services\ConnectionService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CallController extends Controller
{
    public function request(CallRequest $request, ConnectionService $connectionService)
    {
        $user = $request->user();

        $conversation = Conversation::query()
            ->with('participants')
            ->findOrFail($request->input('conversation_id'));

        if (! $conversation->participants()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Not authorized for this conversation.'], 403);
        }

        $participantIds = $conversation->participants()->pluck('user_id')->all();
        $otherId = collect($participantIds)->first(fn ($id) => $id !== $user->id);

        if ($otherId && ! $connectionService->isConnected($user->id, (int) $otherId)) {
            return response()->json(['message' => 'Calls require an active connection.'], 403);
        }

        $call = CallSession::query()->create([
            'conversation_id' => $conversation->id,
            'requested_by_user_id' => $user->id,
            'type' => $request->input('type'),
            'status' => 'requested',
            'expires_at' => Carbon::now()->addMinutes(2),
            'started_at' => null,
            'ended_at' => null,
        ]);

        return response()->json([
            'call' => CallSessionResource::make($call),
        ], 201);
    }

    public function accept(Request $request, CallSession $call)
    {
        if (! $this->isParticipant($request, $call)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $call->update([
            'status' => 'accepted',
            'started_at' => Carbon::now(),
        ]);

        return response()->json([
            'call' => CallSessionResource::make($call),
        ]);
    }

    public function decline(Request $request, CallSession $call)
    {
        if (! $this->isParticipant($request, $call)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $call->update([
            'status' => 'declined',
            'ended_at' => Carbon::now(),
        ]);

        return response()->json([
            'call' => CallSessionResource::make($call),
        ]);
    }

    public function end(Request $request, CallSession $call)
    {
        if (! $this->isParticipant($request, $call)) {
            return response()->json(['message' => 'Not authorized.'], 403);
        }

        $call->update([
            'status' => 'ended',
            'ended_at' => Carbon::now(),
        ]);

        return response()->json([
            'call' => CallSessionResource::make($call),
        ]);
    }

    protected function isParticipant(Request $request, CallSession $call): bool
    {
        $userId = $request->user()->id;

        return $call->conversation
            ->participants()
            ->where('user_id', $userId)
            ->exists();
    }
}
