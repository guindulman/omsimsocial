<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdoptMemoryRequest;
use App\Http\Requests\CreateMemoryRequest;
use App\Http\Requests\ReactMemoryRequest;
use App\Http\Requests\UploadMemoryMediaRequest;
use App\Http\Resources\AdoptionResource;
use App\Http\Resources\MemoryResource;
use App\Http\Resources\UserResource;
use App\Models\Adoption;
use App\Models\Block;
use App\Models\CircleMember;
use App\Models\Connection;
use App\Models\Follow;
use App\Models\Friendship;
use App\Models\HiddenMemory;
use App\Models\InboxEvent;
use App\Models\Memory;
use App\Models\MemoryMedia;
use App\Models\MemoryReshare;
use App\Models\MemoryTag;
use App\Models\MutedUser;
use App\Models\Reaction;
use App\Models\StoryView;
use App\Services\Moderation\ImageModerationService;
use App\Models\VaultItem;
use App\Services\FriendshipService;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class MemoryController extends Controller
{
    public function store(CreateMemoryRequest $request, FriendshipService $friendshipService)
    {
        $user = $request->user();
        $scope = $request->input('scope');

        $circleId = $request->input('circle_id') ? (int) $request->input('circle_id') : null;
        $directUserId = $request->input('direct_user_id') ? (int) $request->input('direct_user_id') : null;

        if ($scope === 'circle') {
            $isMember = CircleMember::query()
                ->where('circle_id', $circleId)
                ->where('user_id', $user->id)
                ->exists();

            if (! $isMember) {
                return response()->json([
                    'code' => 'circle_access_denied',
                    'message' => 'Circle access denied.',
                ], 403);
            }
        }

        if ($scope === 'direct') {
            if (! $directUserId || ! $friendshipService->exists($user->id, $directUserId)) {
                return response()->json([
                    'code' => 'direct_friend_required',
                    'message' => 'Direct memories require a friend.',
                ], 403);
            }
        }

        $expiresAt = $scope === 'story' ? now()->addDay() : null;
        $storyAudience = null;
        if ($scope === 'story') {
            $storyAudience = $user->is_private ? 'friends' : 'public';
        }

        $clientPostId = $request->input('client_post_id');
        if (is_string($clientPostId) && $clientPostId !== '' && ! str_contains($clientPostId, ':')) {
            $suffix = $scope;
            if ($scope === 'circle' && $circleId) {
                $suffix = "circle-{$circleId}";
            } elseif ($scope === 'direct' && $directUserId) {
                $suffix = "direct-{$directUserId}";
            }
            $clientPostId = "{$clientPostId}:{$suffix}";
        }

        $memory = Memory::query()->create([
            'author_id' => $user->id,
            'scope' => $scope,
            'circle_id' => $circleId,
            'direct_user_id' => $directUserId,
            'body' => $request->input('body'),
            'location' => $request->input('location'),
            'client_post_id' => $clientPostId,
            'story_audience' => $storyAudience,
            'expires_at' => $expiresAt,
        ]);

        if ($scope === 'private') {
            VaultItem::query()->firstOrCreate([
                'user_id' => $user->id,
                'memory_id' => $memory->id,
            ], [
                'source' => 'private',
            ]);
        }

        $tags = collect($request->input('tags', []))->unique()->values();
        foreach ($tags as $tagId) {
            MemoryTag::query()->create([
                'memory_id' => $memory->id,
                'user_id' => $tagId,
            ]);
        }

        return response()->json([
            'memory' => MemoryResource::make($memory->load(['author.profile', 'media', 'reactions', 'tags.user.profile'])),
        ], 201);
    }

    public function publicFeed(Request $request)
    {
        $queryTerm = trim((string) $request->query('q', ''));
        $likeOperator = config('database.default') === 'pgsql' ? 'ilike' : 'like';

        $now = now();
        $memories = Memory::query()
            ->where(function ($query) use ($now) {
                $query->where('scope', 'public')
                    ->orWhere(function ($inner) use ($now) {
                        $inner->where('scope', 'story')
                            ->where(function ($audience) {
                                $audience->whereNull('story_audience')
                                    ->orWhere('story_audience', 'public');
                            })
                            ->where(function ($expires) use ($now) {
                                $expires->whereNull('expires_at')
                                    ->orWhere('expires_at', '>', $now);
                            });
                    });
            })
            ->when($queryTerm !== '', function ($builder) use ($queryTerm, $likeOperator) {
                $builder->where(function ($inner) use ($queryTerm, $likeOperator) {
                    $inner->where('body', $likeOperator, "%{$queryTerm}%")
                    ->orWhereHas('author', function ($author) use ($queryTerm, $likeOperator) {
                        $author->where('name', $likeOperator, "%{$queryTerm}%")
                            ->orWhere('username', $likeOperator, "%{$queryTerm}%");
                    });
                });
            })
            ->when($request->user(), fn (Builder $builder) => $this->applyFeedPreferences($builder, $request->user()->id))
            ->with(['author.profile', 'media', 'reactions', 'tags.user.profile'])
            ->withCount('storyViews')
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'data' => MemoryResource::collection($memories),
        ]);
    }

    public function followingFeed(Request $request)
    {
        $user = $request->user();

        $now = now();
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

        $memories = Memory::query()
            ->where(function ($query) use ($followingIds, $friendIds, $now) {
                $query->where(function ($inner) use ($followingIds) {
                    $inner->where('scope', 'followers')
                        ->whereIn('author_id', $followingIds);
                })
                    ->orWhere(function ($inner) use ($friendIds) {
                        $inner->where('scope', 'friends')
                            ->whereIn('author_id', $friendIds);
                    })
                    ->orWhere(function ($inner) use ($followingIds, $friendIds, $now) {
                        $inner->where('scope', 'story')
                            ->where(function ($audience) use ($followingIds, $friendIds) {
                                $audience->where(function ($followers) use ($followingIds) {
                                    $followers->where('story_audience', 'followers')
                                        ->whereIn('author_id', $followingIds);
                                })
                                    ->orWhere(function ($friends) use ($friendIds) {
                                        $friends->where('story_audience', 'friends')
                                            ->whereIn('author_id', $friendIds);
                                    });
                            })
                            ->where(function ($expires) use ($now) {
                                $expires->whereNull('expires_at')
                                    ->orWhere('expires_at', '>', $now);
                            });
                    });
            })
            ->when($request->user(), fn (Builder $builder) => $this->applyFeedPreferences($builder, $request->user()->id))
            ->with(['author.profile', 'media', 'reactions', 'tags.user.profile'])
            ->latest()
            ->limit(50)
            ->get();

        return response()->json([
            'data' => MemoryResource::collection($memories),
        ]);
    }

    public function connectionsFeed(Request $request)
    {
        return $this->followingFeed($request);
    }

    public function mine(Request $request)
    {
        $user = $request->user();

        $now = now();
        $memories = Memory::query()
            ->where('author_id', $user->id)
            ->where(function ($query) use ($now) {
                $query->where('scope', 'story')
                    ->where(function ($expires) use ($now) {
                        $expires->whereNull('expires_at')
                            ->orWhere('expires_at', '>', $now);
                    })
                    ->orWhere('scope', '!=', 'story');
            })
            ->with(['author.profile', 'media', 'reactions', 'tags.user.profile'])
            ->withCount('storyViews')
            ->latest()
            ->get();

        return response()->json([
            'data' => MemoryResource::collection($memories),
        ]);
    }

    protected function applyFeedPreferences(Builder $builder, int $userId): Builder
    {
        $blocksTable = (new Block())->getTable();
        $connectionsTable = (new Connection())->getTable();

        return $builder
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

    public function show(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);
        if ($memory->scope === 'story' && $memory->expires_at && $memory->expires_at->isPast()) {
            return response()->json([
                'code' => 'story_expired',
                'message' => 'Story expired.',
            ], 410);
        }

        return response()->json([
            'memory' => MemoryResource::make($memory->load(['author.profile', 'media', 'reactions', 'tags.user.profile'])->loadCount('storyViews')),
        ]);
    }

    public function viewStory(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        if ($memory->scope !== 'story') {
            return response()->json([
                'code' => 'story_only',
                'message' => 'Views are only tracked for stories.',
            ], 422);
        }

        if ($memory->expires_at && $memory->expires_at->isPast()) {
            return response()->json([
                'code' => 'story_expired',
                'message' => 'Story expired.',
            ], 410);
        }

        $viewer = $request->user();
        if ($viewer->id === $memory->author_id) {
            return response()->json(['message' => 'Author view ignored.']);
        }

        StoryView::query()->firstOrCreate([
            'memory_id' => $memory->id,
            'viewer_user_id' => $viewer->id,
        ]);

        $count = StoryView::query()
            ->where('memory_id', $memory->id)
            ->count();

        return response()->json([
            'count' => $count,
        ], 201);
    }

    public function storyViewers(Request $request, Memory $memory)
    {
        if ($request->user()->id !== $memory->author_id) {
            return response()->json([
                'code' => 'story_viewers_forbidden',
                'message' => 'Only the author can view story viewers.',
            ], 403);
        }

        if ($memory->scope !== 'story') {
            return response()->json([
                'code' => 'story_only',
                'message' => 'Views are only tracked for stories.',
            ], 422);
        }

        $views = StoryView::query()
            ->where('memory_id', $memory->id)
            ->with('viewer.profile')
            ->latest()
            ->get();

        return response()->json([
            'count' => $views->count(),
            'viewers' => $views->map(function (StoryView $view) {
                return UserResource::make($view->viewer);
            })->values(),
        ]);
    }

    public function destroy(Request $request, Memory $memory)
    {
        $this->authorize('delete', $memory);

        $memory->delete();

        return response()->json(['message' => 'Memory deleted.']);
    }

    public function trash(Request $request)
    {
        $user = $request->user();
        $cutoff = now()->subDays(10);

        Memory::onlyTrashed()
            ->where('author_id', $user->id)
            ->where('deleted_at', '<', $cutoff)
            ->forceDelete();

        $memories = Memory::onlyTrashed()
            ->where('author_id', $user->id)
            ->where('deleted_at', '>=', $cutoff)
            ->with(['author.profile', 'media', 'reactions', 'tags.user.profile'])
            ->latest('deleted_at')
            ->get();

        return response()->json([
            'data' => MemoryResource::collection($memories),
        ]);
    }

    public function restore(Request $request, int $memory)
    {
        $user = $request->user();
        $cutoff = now()->subDays(10);

        $memory = Memory::onlyTrashed()
            ->where('id', $memory)
            ->where('author_id', $user->id)
            ->firstOrFail();

        if ($memory->deleted_at && $memory->deleted_at->lt($cutoff)) {
            $memory->forceDelete();
            return response()->json([
                'code' => 'trash_expired',
                'message' => 'Trash expired.',
            ], 410);
        }

        $memory->restore();

        return response()->json([
            'memory' => MemoryResource::make($memory->load(['author.profile', 'media', 'reactions', 'tags.user.profile'])),
        ]);
    }

    public function purge(Request $request, int $memory)
    {
        $user = $request->user();

        $memory = Memory::onlyTrashed()
            ->where('id', $memory)
            ->where('author_id', $user->id)
            ->firstOrFail();

        $memory->forceDelete();

        return response()->json(['message' => 'Memory deleted.']);
    }

    public function addMedia(UploadMemoryMediaRequest $request, Memory $memory, ImageModerationService $moderation)
    {
        if ($memory->author_id !== $request->user()->id) {
            return response()->json([
                'code' => 'media_author_only',
                'message' => 'Only the author can upload media.',
            ], 403);
        }

        $file = $request->file('file');
        $type = (string) $request->input('type');

        if ($type === 'image') {
            $decision = $moderation->moderate($file);
            if (! ($decision['allowed'] ?? false)) {
                return response()->json([
                    'code' => $decision['code'] ?? 'explicit_content_blocked',
                    'message' => $decision['message'] ?? 'Upload rejected.',
                ], 422);
            }
        }

        $disk = 'public';
        $path = $file->storePublicly('memories/'.$memory->id, [
            'disk' => $disk,
        ]);

        $media = MemoryMedia::query()->create([
            'memory_id' => $memory->id,
            'type' => $type,
            'url' => Storage::disk($disk)->url($path),
            'metadata' => $request->input('metadata'),
        ]);

        return response()->json([
            'media' => $media,
        ], 201);
    }

    public function react(ReactMemoryRequest $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        $reaction = Reaction::query()->firstOrCreate([
            'memory_id' => $memory->id,
            'user_id' => $request->user()->id,
            'emoji' => $request->input('emoji'),
        ]);

        if ($reaction->wasRecentlyCreated && $request->input('emoji') === 'heart') {
            Memory::query()
                ->where('id', $memory->id)
                ->update([
                    'hearts_count_cached' => DB::raw('hearts_count_cached + 1'),
                ]);
        }

        if (
            $reaction->wasRecentlyCreated
            && $request->input('emoji') === 'heart'
            && $memory->author_id !== $request->user()->id
        ) {
            $actor = $request->user();
            InboxEvent::query()->create([
                'user_id' => $memory->author_id,
                'type' => 'memory_liked',
                'data' => [
                    'memory_id' => $memory->id,
                    'reaction_id' => $reaction->id,
                    'actor_id' => $actor->id,
                    'actor_name' => $actor->name,
                    'actor_username' => $actor->username,
                    'actor_avatar_url' => $actor->profile?->avatar_url,
                ],
            ]);
        }

        return response()->json([
            'reaction' => $reaction,
        ], 201);
    }

    public function unreact(ReactMemoryRequest $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        $deleted = Reaction::query()
            ->where('memory_id', $memory->id)
            ->where('user_id', $request->user()->id)
            ->where('emoji', $request->input('emoji'))
            ->delete();

        if ($deleted && $request->input('emoji') === 'heart') {
            Memory::query()
                ->where('id', $memory->id)
                ->update([
                    'hearts_count_cached' => DB::raw('GREATEST(hearts_count_cached - 1, 0)'),
                ]);
        }

        return response()->json([
            'message' => 'Reaction removed.',
        ]);
    }

    public function adopt(AdoptMemoryRequest $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        $adoption = Adoption::query()->firstOrNew([
            'memory_id' => $memory->id,
            'user_id' => $request->user()->id,
        ]);

        if ($request->has('note')) {
            $adoption->note = $request->input('note');
        }

        if ($request->filled('visibility')) {
            $adoption->visibility = $request->input('visibility');
        } elseif (! $adoption->exists) {
            $adoption->visibility = 'private';
        }

        $adoption->save();

        VaultItem::query()->updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'memory_id' => $memory->id,
            ],
            [
                'source' => 'adoption',
            ]
        );

        if ($adoption->wasRecentlyCreated) {
            Memory::query()
                ->where('id', $memory->id)
                ->update([
                    'saves_count_cached' => DB::raw('saves_count_cached + 1'),
                ]);
        }

        if ($memory->author_id !== $request->user()->id) {
            $eventType = $adoption->note ? 'adoption_note' : 'memory_saved';
            $actor = $request->user();
            $data = [
                'memory_id' => $memory->id,
                'adoption_id' => $adoption->id,
                'adopter_id' => $request->user()->id,
                'actor_id' => $actor->id,
                'actor_name' => $actor->name,
                'actor_username' => $actor->username,
                'actor_avatar_url' => $actor->profile?->avatar_url,
            ];

            if ($adoption->note) {
                $data['note'] = $adoption->note;
            }

            InboxEvent::query()->create([
                'user_id' => $memory->author_id,
                'type' => $eventType,
                'data' => $data,
            ]);
        }

        return response()->json([
            'adoption' => $adoption,
        ], 201);
    }

    public function adoptions(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        $adoptions = Adoption::query()
            ->where('memory_id', $memory->id)
            ->with('user.profile')
            ->latest()
            ->get();

        return response()->json([
            'data' => AdoptionResource::collection($adoptions),
        ]);
    }

    public function hearts(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        $reactions = Reaction::query()
            ->where('memory_id', $memory->id)
            ->where('emoji', 'heart')
            ->with('user.profile')
            ->latest()
            ->get();

        $users = $reactions->pluck('user')->filter()->values();

        return response()->json([
            'count' => $users->count(),
            'data' => UserResource::collection($users),
        ]);
    }

    public function unsave(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        $deleted = Adoption::query()
            ->where('memory_id', $memory->id)
            ->where('user_id', $request->user()->id)
            ->delete();

        if ($deleted) {
            Memory::query()
                ->where('id', $memory->id)
                ->update([
                    'saves_count_cached' => DB::raw('GREATEST(saves_count_cached - 1, 0)'),
                ]);
        }

        return response()->json([
            'code' => 'save_removed',
            'message' => 'Save removed.',
        ]);
    }

    public function reshare(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        $reshare = MemoryReshare::query()->firstOrCreate([
            'memory_id' => $memory->id,
            'user_id' => $request->user()->id,
        ]);

        if ($reshare->wasRecentlyCreated) {
            Memory::query()
                ->where('id', $memory->id)
                ->update([
                    'reshares_count_cached' => DB::raw('reshares_count_cached + 1'),
                ]);
        }

        if ($reshare->wasRecentlyCreated) {
            $actor = $request->user();
            InboxEvent::query()->create([
                'user_id' => $memory->author_id,
                'type' => 'memory_reshared',
                'data' => [
                    'memory_id' => $memory->id,
                    'reshare_id' => $reshare->id,
                    'actor_id' => $actor->id,
                    'actor_name' => $actor->name,
                    'actor_username' => $actor->username,
                    'actor_avatar_url' => $actor->profile?->avatar_url,
                ],
            ]);
        }

        return response()->json([
            'reshare' => $reshare,
        ], 201);
    }

    public function unreshare(Request $request, Memory $memory)
    {
        $this->authorize('view', $memory);

        $deleted = MemoryReshare::query()
            ->where('memory_id', $memory->id)
            ->where('user_id', $request->user()->id)
            ->delete();

        if ($deleted) {
            Memory::query()
                ->where('id', $memory->id)
                ->update([
                    'reshares_count_cached' => DB::raw('GREATEST(reshares_count_cached - 1, 0)'),
                ]);
        }

        return response()->json([
            'message' => 'Reshare removed.',
        ]);
    }
}
