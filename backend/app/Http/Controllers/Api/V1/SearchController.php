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
use App\Models\MutedUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $viewer = $request->user();
        $query = trim((string) $request->query('q', ''));
        $type = $request->query('type', 'top');
        $limit = (int) $request->query('limit', 20);
        $limit = max(1, min(50, $limit));
        $cursor = $request->query('cursor');

        if ($query === '' || ! $viewer) {
            return response()->json([
                'accounts' => [
                    'data' => [],
                    'next_cursor' => null,
                    'has_more' => false,
                ],
                'posts' => [
                    'data' => [],
                    'next_cursor' => null,
                    'has_more' => false,
                ],
            ]);
        }

        [$followingIds, $friendIds, $circleIds] = $this->buildVisibilityContext($viewer);

        $accountsPayload = null;
        $postsPayload = null;

        if ($type === 'top' || $type === 'accounts') {
            $accountsLimit = $type === 'top' ? 5 : $limit;
            $accountsQuery = $this->applyUserFilters(User::query(), $viewer->id)
                ->with('profile')
                ->where(function ($builder) use ($query) {
                    $like = '%'.strtolower($query).'%';
                    $builder
                        ->whereRaw('lower(username) like ?', [$like])
                        ->orWhereRaw('lower(name) like ?', [$like])
                        ->orWhereHas('profile', function ($profile) use ($like) {
                            $profile->whereRaw('lower(city) like ?', [$like]);
                        });
                })
                ->orderByDesc('created_at')
                ->orderByDesc('id');

            if ($type !== 'top') {
                $this->applyCursorFilter($accountsQuery, $this->decodeCursor($cursor), 'created_at', 'id');
            }

            $accounts = $accountsQuery->limit($accountsLimit + 1)->get();
            $hasMore = $accounts->count() > $accountsLimit;
            $accounts = $accounts->take($accountsLimit);
            $lastAccount = $accounts->last();
            $nextCursor = $hasMore && $lastAccount
                ? $this->encodeCursor($lastAccount->created_at, $lastAccount->id)
                : null;

            $accountsPayload = [
                'data' => UserResource::collection($accounts),
                'next_cursor' => $nextCursor,
                'has_more' => $hasMore,
            ];
        }

        if ($type === 'top' || $type === 'posts') {
            $postsLimit = $type === 'top' ? 10 : $limit;
            $postsQuery = $this->applyMemoryFilters(
                Memory::query(),
                $viewer->id,
                $followingIds,
                $friendIds,
                $circleIds
            )
                ->where(function ($builder) use ($query) {
                    $builder->where('body', 'ilike', '%'.$query.'%');
                })
                ->with([
                    'author.profile',
                    'media',
                    'reactions' => fn ($relation) => $relation->where('user_id', $viewer->id),
                ])
                ->orderByDesc('created_at')
                ->orderByDesc('id');

            if ($type !== 'top') {
                $this->applyCursorFilter($postsQuery, $this->decodeCursor($cursor), 'created_at', 'id');
            }

            $posts = $postsQuery->limit($postsLimit + 1)->get();
            $hasMore = $posts->count() > $postsLimit;
            $posts = $posts->take($postsLimit);
            $lastPost = $posts->last();
            $nextCursor = $hasMore && $lastPost
                ? $this->encodeCursor($lastPost->created_at, $lastPost->id)
                : null;

            $postsPayload = [
                'data' => MemoryResource::collection($posts),
                'next_cursor' => $nextCursor,
                'has_more' => $hasMore,
            ];
        }

        return response()->json([
            'accounts' => $accountsPayload ?? [
                'data' => [],
                'next_cursor' => null,
                'has_more' => false,
            ],
            'posts' => $postsPayload ?? [
                'data' => [],
                'next_cursor' => null,
                'has_more' => false,
            ],
        ]);
    }

    public function suggestedAccounts(Request $request)
    {
        $viewer = $request->user();
        $limit = (int) $request->query('limit', 10);
        $limit = max(1, min(20, $limit));

        if (! $viewer) {
            return response()->json([
                'data' => [],
                'next_cursor' => null,
                'has_more' => false,
            ]);
        }

        $followingIds = Follow::query()
            ->where('follower_id', $viewer->id)
            ->pluck('following_id')
            ->values();

        $friendships = Friendship::query()
            ->where('user_low_id', $viewer->id)
            ->orWhere('user_high_id', $viewer->id)
            ->get(['user_low_id', 'user_high_id']);

        $friendIds = $friendships
            ->map(function (Friendship $friendship) use ($viewer) {
                return $friendship->user_low_id === $viewer->id
                    ? $friendship->user_high_id
                    : $friendship->user_low_id;
            })
            ->filter()
            ->unique(fn ($id) => $id)
            ->values();

        $excludeIds = $followingIds->merge($friendIds)->push($viewer->id)->unique()->values();

        $query = $this->applyUserFilters(User::query(), $viewer->id)
            ->whereNotIn('id', $excludeIds)
            ->with('profile')
            ->whereHas('memories', function ($builder) {
                $builder->where('created_at', '>=', now()->subDays(30));
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $users = $query->limit($limit)->get();

        return response()->json([
            'data' => UserResource::collection($users),
            'next_cursor' => null,
            'has_more' => false,
        ]);
    }

    public function trending(Request $request)
    {
        $viewer = $request->user();
        $limit = (int) $request->query('limit', 10);
        $limit = max(1, min(20, $limit));

        if (! $viewer) {
            return response()->json([
                'data' => [],
                'next_cursor' => null,
                'has_more' => false,
            ]);
        }

        [$followingIds, $friendIds, $circleIds] = $this->buildVisibilityContext($viewer);

        $cacheKey = sprintf('search_trending:%d:%d', $viewer->id, $limit);

        $payload = Cache::remember($cacheKey, now()->addMinutes(10), function () use (
            $viewer,
            $limit,
            $followingIds,
            $friendIds,
            $circleIds
        ) {
            $scoreExpression = '(COALESCE(hearts_count_cached, 0) * 2'
                .' + COALESCE(comments_count_cached, 0) * 3'
                .' + COALESCE(reshares_count_cached, 0) * 4)';

            $query = $this->applyMemoryFilters(
                Memory::query(),
                $viewer->id,
                $followingIds,
                $friendIds,
                $circleIds
            )
                ->select('memories.*')
                ->selectRaw($scoreExpression.' as trending_score')
                ->where('created_at', '>=', now()->subHours(72))
                ->with([
                    'author.profile',
                    'media',
                    'reactions' => fn ($relation) => $relation->where('user_id', $viewer->id),
                ])
                ->orderByDesc('trending_score')
                ->orderByDesc('created_at')
                ->orderByDesc('id')
                ->limit($limit);

            $memories = $query->get();

            return [
                'data' => MemoryResource::collection($memories)->resolve(),
                'next_cursor' => null,
                'has_more' => false,
            ];
        });

        return response()->json($payload);
    }

    protected function buildVisibilityContext(User $viewer): array
    {
        $followingIds = Follow::query()
            ->where('follower_id', $viewer->id)
            ->pluck('following_id');

        $friendships = Friendship::query()
            ->where('user_low_id', $viewer->id)
            ->orWhere('user_high_id', $viewer->id)
            ->get(['user_low_id', 'user_high_id']);

        $friendIds = $friendships
            ->map(function (Friendship $friendship) use ($viewer) {
                return $friendship->user_low_id === $viewer->id
                    ? $friendship->user_high_id
                    : $friendship->user_low_id;
            })
            ->filter()
            ->unique(fn ($id) => $id)
            ->values();

        $circleIds = CircleMember::query()
            ->where('user_id', $viewer->id)
            ->pluck('circle_id');

        return [$followingIds, $friendIds, $circleIds];
    }

    protected function applyUserFilters(Builder $query, int $viewerId): Builder
    {
        $blocksTable = (new Block())->getTable();
        $connectionsTable = (new Connection())->getTable();

        return $query
            ->where('is_active', true)
            ->whereNotExists(function ($sub) use ($viewerId) {
                $sub->selectRaw('1')
                    ->from((new MutedUser())->getTable())
                    ->whereColumn('muted_users.muted_user_id', 'users.id')
                    ->where('muted_users.user_id', $viewerId);
            })
            ->whereNotExists(function ($sub) use ($viewerId, $blocksTable) {
                $sub->selectRaw('1')
                    ->from($blocksTable)
                    ->where(function ($inner) use ($viewerId, $blocksTable) {
                        $inner->where(function ($direct) use ($viewerId, $blocksTable) {
                            $direct->where("{$blocksTable}.blocker_user_id", $viewerId)
                                ->whereColumn("{$blocksTable}.blocked_user_id", 'users.id');
                        })->orWhere(function ($reverse) use ($viewerId, $blocksTable) {
                            $reverse->where("{$blocksTable}.blocked_user_id", $viewerId)
                                ->whereColumn("{$blocksTable}.blocker_user_id", 'users.id');
                        });
                    });
            })
            ->whereNotExists(function ($sub) use ($viewerId, $connectionsTable) {
                $sub->selectRaw('1')
                    ->from($connectionsTable)
                    ->where("{$connectionsTable}.status", 'blocked')
                    ->where(function ($inner) use ($viewerId, $connectionsTable) {
                        $inner->where(function ($direct) use ($viewerId, $connectionsTable) {
                            $direct->where("{$connectionsTable}.requester_id", $viewerId)
                                ->whereColumn("{$connectionsTable}.addressee_id", 'users.id');
                        })->orWhere(function ($reverse) use ($viewerId, $connectionsTable) {
                            $reverse->where("{$connectionsTable}.addressee_id", $viewerId)
                                ->whereColumn("{$connectionsTable}.requester_id", 'users.id');
                        });
                    });
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
