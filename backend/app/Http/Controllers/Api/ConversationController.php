<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateConversationRequest;
use App\Http\Requests\CreateMessageRequest;
use App\Http\Resources\ConversationResource;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Services\ConnectionService;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function store(CreateConversationRequest $request, ConnectionService $connectionService)
    {
        $user = $request->user();
        $participantId = (int) $request->input('participant_user_id');

        if ($participantId === $user->id) {
            return response()->json(['message' => 'Cannot create a conversation with yourself.'], 422);
        }

        if (! $connectionService->isConnected($user->id, $participantId)) {
            return response()->json(['message' => 'You must be connected to start a conversation.'], 403);
        }

        $existing = Conversation::query()
            ->where('type', 'direct')
            ->whereHas('participants', function ($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->whereHas('participants', function ($query) use ($participantId) {
                $query->where('user_id', $participantId);
            })
            ->first();

        if ($existing) {
            return response()->json([
                'conversation' => ConversationResource::make($existing->load('participants.user')),
            ]);
        }

        $conversation = Conversation::query()->create([
            'type' => 'direct',
        ]);

        ConversationParticipant::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $user->id,
        ]);

        ConversationParticipant::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $participantId,
        ]);

        return response()->json([
            'conversation' => ConversationResource::make($conversation->load('participants.user')),
        ], 201);
    }

    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $conversations = Conversation::query()
            ->whereHas('participants', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->with('participants.user')
            ->latest()
            ->get();

        return response()->json([
            'conversations' => ConversationResource::collection($conversations),
        ]);
    }

    public function messages(Request $request, Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $messages = $conversation->messages()->with('user')->latest()->get();

        return response()->json([
            'messages' => MessageResource::collection($messages),
        ]);
    }

    public function storeMessage(CreateMessageRequest $request, Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $message = Message::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $request->user()->id,
            'message' => $request->input('message'),
            'media_url' => $request->input('media_url'),
            'voice_url' => $request->input('voice_url'),
        ]);

        return response()->json([
            'message' => MessageResource::make($message->load('user')),
        ], 201);
    }
}
