<?php

namespace App\Policies;

use App\Models\Circle;
use App\Models\CircleMember;
use App\Models\User;

class CirclePolicy
{
    public function view(User $user, Circle $circle): bool
    {
        return CircleMember::query()
            ->where('circle_id', $circle->id)
            ->where('user_id', $user->id)
            ->exists();
    }

    public function manage(User $user, Circle $circle): bool
    {
        return CircleMember::query()
            ->where('circle_id', $circle->id)
            ->where('user_id', $user->id)
            ->whereIn('role', ['owner', 'admin'])
            ->exists();
    }
}
