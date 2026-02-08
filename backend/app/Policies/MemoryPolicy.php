<?php

namespace App\Policies;

use App\Models\CircleMember;
use App\Models\Memory;
use App\Models\User;
use App\Services\FollowService;
use App\Services\FriendshipService;
use App\Services\ConnectionService;

class MemoryPolicy
{
    public function view(User $user, Memory $memory): bool
    {
        if ($memory->author_id === $user->id) {
            return true;
        }

        if (app(ConnectionService::class)->isBlocked($user->id, $memory->author_id)) {
            return false;
        }

        if ($memory->scope === 'public') {
            return true;
        }

        if ($memory->scope === 'followers') {
            return app(FollowService::class)->isFollowing($user->id, $memory->author_id);
        }

        if ($memory->scope === 'friends') {
            return app(FriendshipService::class)->exists($user->id, $memory->author_id);
        }

        if ($memory->scope === 'circle') {
            return CircleMember::query()
                ->where('circle_id', $memory->circle_id)
                ->where('user_id', $user->id)
                ->exists();
        }

        if ($memory->scope === 'direct') {
            return $memory->direct_user_id === $user->id;
        }

        if ($memory->scope === 'story') {
            $audience = $memory->story_audience ?: 'public';

            if ($audience === 'public') {
                return true;
            }

            if ($audience === 'followers') {
                return app(FollowService::class)->isFollowing($user->id, $memory->author_id);
            }

            if ($audience === 'friends') {
                return app(FriendshipService::class)->exists($user->id, $memory->author_id);
            }

            if ($audience === 'circle') {
                return CircleMember::query()
                    ->where('circle_id', $memory->circle_id)
                    ->where('user_id', $user->id)
                    ->exists();
            }
        }

        return false;
    }

    public function delete(User $user, Memory $memory): bool
    {
        return $memory->author_id === $user->id;
    }
}
