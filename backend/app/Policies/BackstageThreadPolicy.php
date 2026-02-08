<?php

namespace App\Policies;

use App\Models\BackstageThread;
use App\Models\User;

class BackstageThreadPolicy
{
    public function view(User $user, BackstageThread $thread): bool
    {
        return $thread->participants()
            ->where('user_id', $user->id)
            ->exists();
    }
}
