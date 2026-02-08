<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Block;
use App\Models\User;
use Illuminate\Http\Request;

class BlockController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $blocks = Block::query()
            ->where('blocker_user_id', $user->id)
            ->with('blocked.profile')
            ->latest()
            ->get();

        $blockedUsers = $blocks
            ->map(fn (Block $block) => $block->blocked)
            ->filter();

        return response()->json([
            'data' => UserResource::collection($blockedUsers),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $payload = $request->validate([
            'blocked_user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $blockedUserId = (int) $payload['blocked_user_id'];
        if ($blockedUserId === $user->id) {
            return response()->json([
                'code' => 'block_self',
                'message' => 'You cannot block yourself.',
            ], 422);
        }

        $block = Block::query()->firstOrCreate([
            'blocker_user_id' => $user->id,
            'blocked_user_id' => $blockedUserId,
        ], [
            'created_at' => now(),
        ]);

        return response()->json([
            'blocked' => true,
            'block_id' => $block->id,
        ], 201);
    }

    public function destroy(Request $request, User $blockedUser)
    {
        $user = $request->user();

        Block::query()
            ->where('blocker_user_id', $user->id)
            ->where('blocked_user_id', $blockedUser->id)
            ->delete();

        return response()->json([
            'blocked' => false,
        ]);
    }

    public function status(Request $request, User $blockedUser)
    {
        $user = $request->user();

        $blockedByMe = Block::query()
            ->where('blocker_user_id', $user->id)
            ->where('blocked_user_id', $blockedUser->id)
            ->exists();

        $blockedMe = Block::query()
            ->where('blocker_user_id', $blockedUser->id)
            ->where('blocked_user_id', $user->id)
            ->exists();

        return response()->json([
            'blocked' => $blockedByMe || $blockedMe,
            'blocked_by_me' => $blockedByMe,
            'blocked_me' => $blockedMe,
        ]);
    }
}
