<?php

namespace App\Services;

use App\Models\Block;
use App\Models\Connection;

class ConnectionService
{
    /**
     * @return array{0:int,1:int}
     */
    public function pair(int $userIdA, int $userIdB): array
    {
        return $userIdA < $userIdB ? [$userIdA, $userIdB] : [$userIdB, $userIdA];
    }

    /**
     * @return array{0:int,1:int}
     */
    public function normalizePair(int $userIdA, int $userIdB): array
    {
        return $this->pair($userIdA, $userIdB);
    }

    public function exists(int $userIdA, int $userIdB): bool
    {
        if ($userIdA === $userIdB) {
            return true;
        }

        [$low, $high] = $this->pair($userIdA, $userIdB);

        return Connection::query()
            ->where('status', 'accepted')
            ->where('user_low_id', $low)
            ->where('user_high_id', $high)
            ->exists();
    }

    public function create(int $userIdA, int $userIdB, ?int $requesterId = null, ?int $addresseeId = null, ?\Carbon\Carbon $verifiedAt = null): Connection
    {
        [$low, $high] = $this->pair($userIdA, $userIdB);
        $requesterId = $requesterId ?? $userIdA;
        $addresseeId = $addresseeId ?? $userIdB;

        $connection = Connection::query()
            ->where('user_low_id', $low)
            ->where('user_high_id', $high)
            ->first();

        if ($connection) {
            $updates = [];
            if ($connection->status !== 'accepted') {
                $updates['status'] = 'accepted';
            }
            if (! $connection->requester_id) {
                $updates['requester_id'] = $requesterId;
            }
            if (! $connection->addressee_id) {
                $updates['addressee_id'] = $addresseeId;
            }
            if ($verifiedAt && ! $connection->verified_at) {
                $updates['verified_at'] = $verifiedAt;
            }
            if ($updates) {
                $connection->update($updates);
            }

            return $connection;
        }

        return Connection::query()->create([
            'requester_id' => $requesterId,
            'addressee_id' => $addresseeId,
            'user_low_id' => $low,
            'user_high_id' => $high,
            'verified_at' => $verifiedAt,
            'status' => 'accepted',
        ]);
    }

    public function isConnected(int $userIdA, int $userIdB): bool
    {
        return $this->exists($userIdA, $userIdB);
    }

    public function isBlocked(int $userIdA, int $userIdB): bool
    {
        $blocked = Connection::query()
            ->where('status', 'blocked')
            ->where(function ($query) use ($userIdA, $userIdB) {
                $query->where('requester_id', $userIdA)
                    ->where('addressee_id', $userIdB)
                    ->orWhere(function ($inner) use ($userIdA, $userIdB) {
                        $inner->where('requester_id', $userIdB)
                            ->where('addressee_id', $userIdA);
                    });
            })
            ->exists();

        if ($blocked) {
            return true;
        }

        return Block::query()
            ->where(function ($query) use ($userIdA, $userIdB) {
                $query->where('blocker_user_id', $userIdA)
                    ->where('blocked_user_id', $userIdB)
                    ->orWhere(function ($inner) use ($userIdA, $userIdB) {
                        $inner->where('blocker_user_id', $userIdB)
                            ->where('blocked_user_id', $userIdA);
                    });
            })
            ->exists();
    }
}
