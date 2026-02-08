<?php

namespace App\Services;

use App\Models\Follow;
use App\Models\FollowRequest;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class FollowService
{
    public function isFollowing(int $followerId, int $followingId): bool
    {
        if ($followerId === $followingId) {
            return true;
        }

        return Follow::query()
            ->where('follower_id', $followerId)
            ->where('following_id', $followingId)
            ->exists();
    }

    public function createFollow(User $viewer, User $target): Follow
    {
        return Follow::query()->create([
            'follower_id' => $viewer->id,
            'following_id' => $target->id,
        ]);
    }

    public function createFollowRequest(User $viewer, User $target): FollowRequest
    {
        return FollowRequest::query()->create([
            'requester_id' => $viewer->id,
            'target_id' => $target->id,
            'status' => 'pending',
        ]);
    }

    public function unfollow(User $viewer, User $target): void
    {
        Follow::query()
            ->where('follower_id', $viewer->id)
            ->where('following_id', $target->id)
            ->delete();
    }

    public function acceptRequest(FollowRequest $request): Follow
    {
        return DB::transaction(function () use ($request) {
            $request->update(['status' => 'accepted']);

            return Follow::query()->firstOrCreate([
                'follower_id' => $request->requester_id,
                'following_id' => $request->target_id,
            ]);
        });
    }

    public function declineRequest(FollowRequest $request): void
    {
        $request->update(['status' => 'declined']);
    }

    public function cancelRequest(FollowRequest $request): void
    {
        $request->update(['status' => 'canceled']);
    }
}
