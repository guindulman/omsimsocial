<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\HiddenMemory;
use App\Models\Memory;
use App\Models\MutedUser;
use App\Models\User;
use App\Http\Resources\MemoryResource;
use Illuminate\Http\Request;

class FeedPreferenceController extends Controller
{
    public function hide(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        HiddenMemory::query()->firstOrCreate([
            'user_id' => $request->user()->id,
            'memory_id' => $memory->id,
        ]);

        return response()->json([
            'ok' => true,
        ]);
    }

    public function unhide(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        HiddenMemory::query()
            ->where('user_id', $request->user()->id)
            ->where('memory_id', $memory->id)
            ->delete();

        return response()->json([
            'ok' => true,
        ]);
    }

    public function hidden(Request $request)
    {
        $userId = $request->user()->id;
        $memoryIds = HiddenMemory::query()
            ->where('user_id', $userId)
            ->pluck('memory_id');

        if ($memoryIds->isEmpty()) {
            return response()->json(['data' => []]);
        }

        $memories = Memory::query()
            ->whereIn('id', $memoryIds)
            ->with(['author.profile', 'media', 'reactions', 'tags.user.profile'])
            ->latest()
            ->get();

        return response()->json([
            'data' => MemoryResource::collection($memories),
        ]);
    }

    public function mute(Request $request, User $user)
    {
        $actor = $request->user();
        if ($actor->id === $user->id) {
            return response()->json([
                'code' => 'mute_self_forbidden',
                'message' => 'You cannot mute yourself.',
            ], 422);
        }

        MutedUser::query()->firstOrCreate([
            'user_id' => $actor->id,
            'muted_user_id' => $user->id,
        ]);

        return response()->json([
            'ok' => true,
        ]);
    }

    public function unmute(Request $request, User $user)
    {
        $actor = $request->user();

        MutedUser::query()
            ->where('user_id', $actor->id)
            ->where('muted_user_id', $user->id)
            ->delete();

        return response()->json([
            'ok' => true,
        ]);
    }
}
