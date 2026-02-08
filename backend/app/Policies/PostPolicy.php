<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;
use App\Services\ConnectionService;

class PostPolicy
{
    public function view(User $user, Post $post): bool
    {
        if ($post->user_id === $user->id) {
            return true;
        }

        if ($post->status === 'expired') {
            return false;
        }

        if ($post->visibility_scope === 'public') {
            return true;
        }

        $connectionService = app(ConnectionService::class);

        return $connectionService->isConnected($user->id, $post->user_id);
    }

    public function delete(User $user, Post $post): bool
    {
        return $post->user_id === $user->id;
    }
}
