<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\MemoryResource;
use App\Http\Resources\UserResource;
use App\Models\Block;
use App\Models\CircleMember;
use App\Models\Connection;
use App\Models\Follow;
use App\Models\Friendship;
use App\Models\HiddenMemory;
use App\Models\Memory;
use App\Models\MemoryReshare;
use App\Models\MutedUser;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class HomeFeedController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $limit = (int) $request->query('limit', 30);
        $limit = max(1, min(50, $limit));
        $cursor = $request->query('cursor');
        $cursorData = $this->decodeCursor($cursor);

        $followingIds = Follow::query()
            ->where('follower_id', $user->id)
            ->pluck('following_id');

        $friendships = Friendship::query()
            ->where('user_low_id', $user->id)
            ->orWhere('user_high_id', $user->id)
            ->get(['user_low_id', 'user_high_id']);

        $friendIds = $friendships
            ->map(function (Friendship $friendship) use ($user) {
                return $friendship->user_low_id === $user->id
                    ? $friendship->user_high_id
                    : $friendship->user_low_id;
            })
            ->filter()
            ->unique(fn ($id) => $id)
            ->values();

        $circleIds = CircleMember::query()
            ->where('user_id', $user->id)
            ->pluck('circle_id');

        $oversample = $limit * 5;
        $includeTags = $request->boolean('include_tags', true);
        $seen = [];
        $items = collect();
        $resharePreviewByKey = [];
        $reshareCountByKey = [];
        $resharePreviewSeenByKey = [];

        $memoryWith = [
            'author.profile',
            'media',
            'reactions' => fn ($query) => $query->where('user_id', $user->id),
        ];
        if ($includeTags) {
            $memoryWith[] = 'tags.user';
        }

        $memoryQuery = $this->baseQuery($user->id, $followingIds, $friendIds, $circleIds)
            ->with($memoryWith)
            ->orderByDesc('created_at')
            ->orderByDesc('id');
        $this->applyCursorFilter($memoryQuery, $cursorData, 'created_at', 'id');
        $memories = $memoryQuery->limit($oversample)->get();

        foreach ($memories as $memory) {
            $items->push([
                'type' => 'memory',
                'memory' => $memory,
                'sort_time' => $memory->created_at?->getTimestamp() ?? 0,
                'cursor_time' => $memory->created_at,
                'sort_id' => $memory->id,
            ]);
        }

        $reshareWith = [
            'memory.author.profile',
            'memory.media',
            'memory.reactions' => fn ($query) => $query->where('user_id', $user->id),
        ];
        if ($includeTags) {
            $reshareWith[] = 'memory.tags.user';
        }

        $reshareQuery = $this->reshareQuery($user->id, $followingIds, $friendIds, $circleIds)
            ->with($reshareWith)
            ->orderByDesc('created_at')
            ->orderByDesc('id');
        $this->applyCursorFilter($reshareQuery, $cursorData, 'created_at', 'id');
        $reshares = $reshareQuery->limit($oversample)->get();

        foreach ($reshares as $reshare) {
            if (! $reshare->memory) {
                continue;
            }
            $items->push([
                'type' => 'reshare',
                'memory' => $reshare->memory,
                'reshare' => $reshare,
                'sort_time' => $reshare->created_at?->getTimestamp() ?? 0,
                'cursor_time' => $reshare->created_at,
                'sort_id' => $reshare->id,
            ]);
        }

        $sorted = $items
            ->sort(function ($a, $b) {
                $timeCompare = ($b['sort_time'] ?? 0) <=> ($a['sort_time'] ?? 0);
                if ($timeCompare !== 0) {
                    return $timeCompare;
                }
                return ($b['sort_id'] ?? 0) <=> ($a['sort_id'] ?? 0);
            })
            ->values();

        $deduped = collect();
        foreach ($sorted as $item) {
            $key = $this->dedupeKey($item['memory']);

            if ($item['type'] === 'reshare') {
                $reshareCountByKey[$key] = ($reshareCountByKey[$key] ?? 0) + 1;
                if (! isset($resharePreviewByKey[$key])) {
                    $resharePreviewByKey[$key] = [];
                    $resharePreviewSeenByKey[$key] = [];
                }
                $reshareUser = $item['reshare']->user;
                $reshareUserId = $reshareUser?->id;
                if (
                    $reshareUserId
                    && ! isset($resharePreviewSeenByKey[$key][$reshareUserId])
                    && count($resharePreviewByKey[$key]) < 5
                ) {
                    $resharePreviewByKey[$key][] = $reshareUser;
                    $resharePreviewSeenByKey[$key][$reshareUserId] = true;
                }
            }

            if ($deduped->count() >= $limit || isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $deduped->push($item);
        }

        $lastItem = $deduped->last();
        $nextCursor = $lastItem
            ? $this->encodeCursor($lastItem['cursor_time'], $lastItem['sort_id'])
            : null;
        $hasMore = $deduped->count() >= $limit
            && ($memories->count() >= $oversample || $reshares->count() >= $oversample);

        $data = $deduped->map(function ($item) use ($reshareCountByKey, $resharePreviewByKey) {
            $memoryData = MemoryResource::make($item['memory'])->resolve();
            $key = $this->dedupeKey($item['memory']);
            $previewUsers = $resharePreviewByKey[$key] ?? [];
            $previewCount = $reshareCountByKey[$key] ?? 0;
            $memoryData['reshare_preview'] = [
                'count_in_window' => $previewCount,
                'users' => array_map(
                    fn ($user) => UserResource::make($user)->resolve(),
                    $previewUsers
                ),
                'has_more_in_window' => $previewCount > count($previewUsers),
            ];
            if ($item['type'] === 'reshare') {
                $memoryData['feed_type'] = 'reshare';
                $memoryData['reshare'] = [
                    'id' => $item['reshare']->id,
                    'created_at' => $item['reshare']->created_at,
                    'user' => UserResource::make($item['reshare']->user)->resolve(),
                ];
            } else {
                $memoryData['feed_type'] = 'memory';
            }
            return $memoryData;
        });

        return response()->json([
            'data' => $data,
            'next_cursor' => $nextCursor,
            'has_more' => $hasMore,
        ]);
    }

    protected function dedupeKey(Memory $memory): string
    {
        if ($memory->client_post_id) {
            $parts = explode(':', $memory->client_post_id, 2);
            $groupId = $parts[0] ?: $memory->client_post_id;
            return $memory->author_id.':'.$groupId;
        }

        return 'id:'.$memory->id;
    }

    protected function baseQuery(
        int $userId,
        $followingIds,
        $friendIds,
        $circleIds
    ): Builder {
        return $this->applyMemoryFilters(
            Memory::query(),
            $userId,
            $followingIds,
            $friendIds,
            $circleIds
        );
    }

    protected function reshareQuery(
        int $userId,
        $followingIds,
        $friendIds,
        $circleIds
    ): Builder {
        $resharerIds = collect($followingIds)
            ->merge($friendIds)
            ->push($userId)
            ->unique()
            ->values();

        $blocksTable = (new Block())->getTable();
        $connectionsTable = (new Connection())->getTable();

        return MemoryReshare::query()
            ->whereIn('user_id', $resharerIds)
            ->whereNotExists(function ($sub) use ($userId) {
                $sub->selectRaw('1')
                    ->from((new MutedUser())->getTable())
                    ->whereColumn('muted_users.muted_user_id', 'memory_reshares.user_id')
                    ->where('muted_users.user_id', $userId);
            })
            ->whereNotExists(function ($sub) use ($userId, $blocksTable) {
                $sub->selectRaw('1')
                    ->from($blocksTable)
                    ->where(function ($inner) use ($userId, $blocksTable) {
                        $inner->where(function ($direct) use ($userId, $blocksTable) {
                            $direct->where("{$blocksTable}.blocker_user_id", $userId)
                                ->whereColumn("{$blocksTable}.blocked_user_id", 'memory_reshares.user_id');
                        })->orWhere(function ($reverse) use ($userId, $blocksTable) {
                            $reverse->where("{$blocksTable}.blocked_user_id", $userId)
                                ->whereColumn("{$blocksTable}.blocker_user_id", 'memory_reshares.user_id');
                        });
                    });
            })
            ->whereNotExists(function ($sub) use ($userId, $connectionsTable) {
                $sub->selectRaw('1')
                    ->from($connectionsTable)
                    ->where("{$connectionsTable}.status", 'blocked')
                    ->where(function ($inner) use ($userId, $connectionsTable) {
                        $inner->where(function ($direct) use ($userId, $connectionsTable) {
                            $direct->where("{$connectionsTable}.requester_id", $userId)
                                ->whereColumn("{$connectionsTable}.addressee_id", 'memory_reshares.user_id');
                        })->orWhere(function ($reverse) use ($userId, $connectionsTable) {
                            $reverse->where("{$connectionsTable}.addressee_id", $userId)
                                ->whereColumn("{$connectionsTable}.requester_id", 'memory_reshares.user_id');
                        });
                    });
            })
            ->whereHas('memory', function ($query) use ($userId, $followingIds, $friendIds, $circleIds) {
                $this->applyMemoryFilters($query, $userId, $followingIds, $friendIds, $circleIds);
            });
    }

    protected function applyMemoryFilters(
        Builder $query,
        int $userId,
        $followingIds,
        $friendIds,
        $circleIds
    ): Builder {
        $blocksTable = (new Block())->getTable();
        $connectionsTable = (new Connection())->getTable();

        return $query
            ->where(function ($query) use ($userId, $followingIds, $friendIds, $circleIds) {
                $query
                    ->where('scope', 'public')
                    ->orWhere(function ($inner) use ($followingIds) {
                        $inner->where('scope', 'followers')
                            ->whereIn('author_id', $followingIds);
                    })
                    ->orWhere(function ($inner) use ($friendIds) {
                        $inner->where('scope', 'friends')
                            ->whereIn('author_id', $friendIds);
                    })
                    ->orWhere(function ($inner) use ($circleIds) {
                        $inner->where('scope', 'circle')
                            ->whereIn('circle_id', $circleIds);
                    })
                    ->orWhere(function ($inner) use ($userId) {
                        $inner->where('scope', 'direct')
                            ->where(function ($direct) use ($userId) {
                                $direct->where('direct_user_id', $userId)
                                    ->orWhere('author_id', $userId);
                            });
                    })
                    ->orWhere('author_id', $userId);
            })
            ->where('scope', '!=', 'story')
            ->whereNull('story_audience')
            ->whereNull('expires_at')
            ->whereNotExists(function ($sub) use ($userId) {
                $sub->selectRaw('1')
                    ->from((new HiddenMemory())->getTable())
                    ->whereColumn('hidden_memories.memory_id', 'memories.id')
                    ->where('hidden_memories.user_id', $userId);
            })
            ->whereNotExists(function ($sub) use ($userId) {
                $sub->selectRaw('1')
                    ->from((new MutedUser())->getTable())
                    ->whereColumn('muted_users.muted_user_id', 'memories.author_id')
                    ->where('muted_users.user_id', $userId);
            })
            ->whereNotExists(function ($sub) use ($userId, $blocksTable) {
                $sub->selectRaw('1')
                    ->from($blocksTable)
                    ->where(function ($inner) use ($userId, $blocksTable) {
                        $inner->where(function ($direct) use ($userId, $blocksTable) {
                            $direct->where("{$blocksTable}.blocker_user_id", $userId)
                                ->whereColumn("{$blocksTable}.blocked_user_id", 'memories.author_id');
                        })->orWhere(function ($reverse) use ($userId, $blocksTable) {
                            $reverse->where("{$blocksTable}.blocked_user_id", $userId)
                                ->whereColumn("{$blocksTable}.blocker_user_id", 'memories.author_id');
                        });
                    });
            })
            ->whereNotExists(function ($sub) use ($userId, $connectionsTable) {
                $sub->selectRaw('1')
                    ->from($connectionsTable)
                    ->where("{$connectionsTable}.status", 'blocked')
                    ->where(function ($inner) use ($userId, $connectionsTable) {
                        $inner->where(function ($direct) use ($userId, $connectionsTable) {
                            $direct->where("{$connectionsTable}.requester_id", $userId)
                                ->whereColumn("{$connectionsTable}.addressee_id", 'memories.author_id');
                        })->orWhere(function ($reverse) use ($userId, $connectionsTable) {
                            $reverse->where("{$connectionsTable}.addressee_id", $userId)
                                ->whereColumn("{$connectionsTable}.requester_id", 'memories.author_id');
                        });
                    });
            });
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
