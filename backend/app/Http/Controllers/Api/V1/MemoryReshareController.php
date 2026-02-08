<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Block;
use App\Models\Connection;
use App\Models\Memory;
use App\Models\MemoryReshare;
use App\Models\MutedUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class MemoryReshareController extends Controller
{
    public function index(Request $request, Memory $memory)
    {
        $viewer = $request->user();
        $this->authorize('view', $memory);

        $limit = (int) $request->query('limit', 30);
        $limit = max(1, min(50, $limit));
        $cursor = $request->query('cursor');
        $cursorData = $this->decodeCursor($cursor);

        $blocksTable = (new Block())->getTable();
        $connectionsTable = (new Connection())->getTable();

        $query = MemoryReshare::query()
            ->where('memory_id', $memory->id)
            ->whereNotExists(function ($sub) use ($viewer) {
                $sub->selectRaw('1')
                    ->from((new MutedUser())->getTable())
                    ->whereColumn('muted_users.muted_user_id', 'memory_reshares.user_id')
                    ->where('muted_users.user_id', $viewer->id);
            })
            ->whereNotExists(function ($sub) use ($viewer, $blocksTable) {
                $sub->selectRaw('1')
                    ->from($blocksTable)
                    ->where(function ($inner) use ($viewer, $blocksTable) {
                        $inner->where(function ($direct) use ($viewer, $blocksTable) {
                            $direct->where("{$blocksTable}.blocker_user_id", $viewer->id)
                                ->whereColumn("{$blocksTable}.blocked_user_id", 'memory_reshares.user_id');
                        })->orWhere(function ($reverse) use ($viewer, $blocksTable) {
                            $reverse->where("{$blocksTable}.blocked_user_id", $viewer->id)
                                ->whereColumn("{$blocksTable}.blocker_user_id", 'memory_reshares.user_id');
                        });
                    });
            })
            ->whereNotExists(function ($sub) use ($viewer, $connectionsTable) {
                $sub->selectRaw('1')
                    ->from($connectionsTable)
                    ->where("{$connectionsTable}.status", 'blocked')
                    ->where(function ($inner) use ($viewer, $connectionsTable) {
                        $inner->where(function ($direct) use ($viewer, $connectionsTable) {
                            $direct->where("{$connectionsTable}.requester_id", $viewer->id)
                                ->whereColumn("{$connectionsTable}.addressee_id", 'memory_reshares.user_id');
                        })->orWhere(function ($reverse) use ($viewer, $connectionsTable) {
                            $reverse->where("{$connectionsTable}.addressee_id", $viewer->id)
                                ->whereColumn("{$connectionsTable}.requester_id", 'memory_reshares.user_id');
                        });
                    });
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $this->applyCursorFilter($query, $cursorData, 'created_at', 'id');

        $reshares = $query
            ->with('user.profile')
            ->limit($limit + 1)
            ->get();

        $hasMore = $reshares->count() > $limit;
        $items = $reshares->take($limit);
        $lastItem = $items->last();
        $nextCursor = $lastItem
            ? $this->encodeCursor($lastItem->created_at, $lastItem->id)
            : null;

        $users = $items
            ->pluck('user')
            ->filter()
            ->values();

        return response()->json([
            'data' => UserResource::collection($users),
            'next_cursor' => $nextCursor,
            'has_more' => $hasMore,
        ]);
    }

    protected function applyCursorFilter(
        Builder $query,
        ?array $cursorData,
        string $createdColumn,
        string $idColumn
    ): void {
        if (! $cursorData) {
            return;
        }

        $cursorTime = $cursorData['time'] ?? null;
        $cursorId = $cursorData['id'] ?? null;
        if (! $cursorTime || ! $cursorId) {
            return;
        }

        $query->where(function ($builder) use ($createdColumn, $idColumn, $cursorTime, $cursorId) {
            $builder
                ->where($createdColumn, '<', $cursorTime)
                ->orWhere(function ($inner) use ($createdColumn, $idColumn, $cursorTime, $cursorId) {
                    $inner->where($createdColumn, $cursorTime)
                        ->where($idColumn, '<', $cursorId);
                });
        });
    }

    protected function decodeCursor(?string $cursor): ?array
    {
        if (! $cursor) {
            return null;
        }

        $decoded = base64_decode($cursor, true);
        if (! $decoded) {
            return null;
        }

        $payload = json_decode($decoded, true);
        if (! is_array($payload)) {
            return null;
        }

        return [
            'time' => $payload['time'] ?? null,
            'id' => isset($payload['id']) ? (int) $payload['id'] : null,
        ];
    }

    protected function encodeCursor($time, int $id): string
    {
        $timestamp = $time instanceof \DateTimeInterface
            ? $time->format('Y-m-d H:i:s.u')
            : (string) $time;
        $payload = [
            'time' => $timestamp,
            'id' => $id,
        ];

        return base64_encode(json_encode($payload));
    }
}
