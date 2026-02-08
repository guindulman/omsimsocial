<?php

namespace App\Services;

use App\Models\FriendRequest;
use App\Models\Friendship;
use Illuminate\Support\Facades\DB;

class FriendshipService
{
    /**
     * @return array{0:int,1:int}
     */
    public function pair(int $userIdA, int $userIdB): array
    {
        return $userIdA < $userIdB ? [$userIdA, $userIdB] : [$userIdB, $userIdA];
    }

    public function exists(int $userIdA, int $userIdB): bool
    {
        if ($userIdA === $userIdB) {
            return true;
        }

        [$low, $high] = $this->pair($userIdA, $userIdB);

        return Friendship::query()
            ->where('user_low_id', $low)
            ->where('user_high_id', $high)
            ->exists();
    }

    public function requestFriend(int $fromUserId, int $toUserId, ?string $message = null): FriendRequest
    {
        return FriendRequest::query()->create([
            'from_user_id' => $fromUserId,
            'to_user_id' => $toUserId,
            'status' => 'pending',
            'message' => $message,
        ]);
    }

    public function acceptRequest(FriendRequest $request): Friendship
    {
        return DB::transaction(function () use ($request) {
            $request->update(['status' => 'accepted']);

            [$low, $high] = $this->pair($request->from_user_id, $request->to_user_id);

            return Friendship::query()->firstOrCreate([
                'user_low_id' => $low,
                'user_high_id' => $high,
            ]);
        });
    }

    public function declineRequest(FriendRequest $request): void
    {
        $request->update(['status' => 'declined']);
    }

    public function cancelRequest(FriendRequest $request): void
    {
        $request->update(['status' => 'canceled']);
    }

    public function unfriend(int $userIdA, int $userIdB): void
    {
        [$low, $high] = $this->pair($userIdA, $userIdB);

        Friendship::query()
            ->where('user_low_id', $low)
            ->where('user_high_id', $high)
            ->delete();
    }

    public function verifyFriendship(int $userIdA, int $userIdB): ?Friendship
    {
        [$low, $high] = $this->pair($userIdA, $userIdB);

        $friendship = Friendship::query()
            ->where('user_low_id', $low)
            ->where('user_high_id', $high)
            ->first();

        if (! $friendship) {
            return null;
        }

        if (! $friendship->verified_at) {
            $friendship->update(['verified_at' => now()]);
        }

        return $friendship;
    }
}
