<?php

namespace App\Policies;

use App\Models\LiveRoom;
use App\Models\User;
use App\Services\ConnectionService;

class LiveRoomPolicy
{
    public function view(User $user, LiveRoom $room): bool
    {
        if ($room->host_user_id === $user->id) {
            return true;
        }

        if ($room->visibility === 'public') {
            return true;
        }

        if ($room->visibility === 'invite') {
            return $room->members()->where('user_id', $user->id)->exists();
        }

        $connectionService = app(ConnectionService::class);

        return $connectionService->isConnected($user->id, $room->host_user_id);
    }

    public function manage(User $user, LiveRoom $room): bool
    {
        if ($room->host_user_id === $user->id) {
            return true;
        }

        return $room->members()
            ->where('user_id', $user->id)
            ->where('role', 'mod')
            ->exists();
    }
}
