<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BackstageMessageRequest;
use App\Http\Resources\BackstageMessageResource;
use App\Http\Resources\BackstageThreadResource;
use App\Models\BackstageMessage;
use App\Models\BackstageThread;
use App\Models\BackstageThreadParticipant;
use App\Models\Post;
use Illuminate\Http\Request;

class BackstageController extends Controller
{
    public function thread(Request $request, Post $post)
    {
        $user = $request->user();

        $isOwner = $post->user_id === $user->id;
        $isAdopter = $post->adoptions()->where('adopter_user_id', $user->id)->exists();

        if (! $isOwner && ! $isAdopter) {
            return response()->json(['message' => 'Not authorized for backstage.'], 403);
        }

        $thread = $post->backstageThread()->firstOrCreate([
            'post_id' => $post->id,
        ], [
            'created_by_user_id' => $user->id,
        ]);

        BackstageThreadParticipant::query()->firstOrCreate([
            'thread_id' => $thread->id,
            'user_id' => $post->user_id,
        ], [
            'role' => 'mod',
        ]);

        BackstageThreadParticipant::query()->firstOrCreate([
            'thread_id' => $thread->id,
            'user_id' => $user->id,
        ], [
            'role' => $isOwner ? 'mod' : 'member',
        ]);

        return response()->json([
            'thread' => BackstageThreadResource::make($thread->load('participants')),
        ]);
    }

    public function messages(Request $request, BackstageThread $thread)
    {
        $this->authorize('view', $thread);

        $messages = $thread->messages()->with('user')->latest()->get();

        return response()->json([
            'messages' => BackstageMessageResource::collection($messages),
        ]);
    }

    public function storeMessage(BackstageMessageRequest $request, BackstageThread $thread)
    {
        $this->authorize('view', $thread);

        $message = BackstageMessage::query()->create([
            'thread_id' => $thread->id,
            'user_id' => $request->user()->id,
            'message' => $request->input('message'),
            'media_url' => $request->input('media_url'),
        ]);

        return response()->json([
            'message' => BackstageMessageResource::make($message->load('user')),
        ], 201);
    }
}
