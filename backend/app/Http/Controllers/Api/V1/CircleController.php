<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AddCircleMemberRequest;
use App\Http\Requests\CreateCircleRequest;
use App\Http\Requests\CreatePromptRequest;
use App\Http\Requests\UpdateCircleRequest;
use App\Http\Resources\CircleResource;
use App\Http\Resources\MemoryResource;
use App\Models\Block;
use App\Models\Circle;
use App\Models\CircleMember;
use App\Models\Connection;
use App\Models\CirclePrompt;
use App\Models\HiddenMemory;
use App\Models\Memory;
use App\Models\MutedUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder;

class CircleController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $circleIds = CircleMember::query()
            ->where('user_id', $user->id)
            ->pluck('circle_id');

        $circles = Circle::query()
            ->whereIn('id', $circleIds)
            ->with(['owner.profile'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => CircleResource::collection($circles),
        ]);
    }

    public function store(CreateCircleRequest $request)
    {
        $user = $request->user();

        $circle = DB::transaction(function () use ($request, $user) {
            $circle = Circle::query()->create([
                'owner_id' => $user->id,
                'name' => $request->input('name'),
                'icon' => $request->input('icon'),
                'invite_only' => $request->boolean('invite_only', true),
                'prompt_frequency' => $request->input('prompt_frequency') ?: 'off',
            ]);

            CircleMember::query()->create([
                'circle_id' => $circle->id,
                'user_id' => $user->id,
                'role' => 'owner',
            ]);

            $memberIds = collect($request->input('member_ids', []))
                ->unique()
                ->reject(fn ($id) => $id === $user->id);

            foreach ($memberIds as $memberId) {
                CircleMember::query()->create([
                    'circle_id' => $circle->id,
                    'user_id' => $memberId,
                    'role' => 'member',
                ]);
            }

            return $circle;
        });

        return response()->json([
            'circle' => CircleResource::make($circle->load(['owner.profile', 'members.user.profile'])),
        ], 201);
    }

    public function show(Request $request, Circle $circle)
    {
        $this->authorize('view', $circle);

        return response()->json([
            'circle' => CircleResource::make($circle->load(['owner.profile', 'members.user.profile'])),
        ]);
    }

    public function addMember(AddCircleMemberRequest $request, Circle $circle)
    {
        $this->authorize('manage', $circle);

        $member = CircleMember::query()->firstOrCreate(
            [
                'circle_id' => $circle->id,
                'user_id' => $request->integer('user_id'),
            ],
            [
                'role' => $request->input('role') ?: 'member',
            ]
        );

        return response()->json([
            'member' => $member->load('user'),
        ], 201);
    }

    public function removeMember(Request $request, Circle $circle, int $userId)
    {
        $this->authorize('manage', $circle);

        CircleMember::query()
            ->where('circle_id', $circle->id)
            ->where('user_id', $userId)
            ->delete();

        return response()->json(['message' => 'Member removed.']);
    }

    public function update(UpdateCircleRequest $request, Circle $circle)
    {
        $this->authorize('manage', $circle);

        $circle->update([
            'name' => $request->input('name') ?: $circle->name,
            'icon' => $request->input('icon') ?: $circle->icon,
            'invite_only' => $request->boolean('invite_only', $circle->invite_only),
            'prompt_frequency' => $request->input('prompt_frequency') ?: $circle->prompt_frequency,
        ]);

        return response()->json([
            'circle' => CircleResource::make($circle->load(['owner.profile', 'members.user.profile'])),
        ]);
    }

    public function createPrompt(CreatePromptRequest $request, Circle $circle)
    {
        $this->authorize('manage', $circle);

        $prompt = CirclePrompt::query()->create([
            'circle_id' => $circle->id,
            'creator_id' => $request->user()->id,
            'prompt' => $request->input('prompt'),
        ]);

        return response()->json([
            'prompt' => [
                'id' => $prompt->id,
                'prompt' => $prompt->prompt,
                'created_at' => $prompt->created_at,
            ],
        ], 201);
    }

    public function feed(Request $request, Circle $circle)
    {
        $this->authorize('view', $circle);

        $prompt = CirclePrompt::query()
            ->where('circle_id', $circle->id)
            ->latest()
            ->first();

        $memories = Memory::query()
            ->where('scope', 'circle')
            ->where('circle_id', $circle->id)
            ->when($request->user(), fn (Builder $builder) => $this->applyFeedPreferences($builder, $request->user()->id))
            ->with(['author.profile', 'media', 'reactions', 'tags.user.profile'])
            ->latest()
            ->get();

        return response()->json([
            'prompt' => $prompt ? [
                'id' => $prompt->id,
                'prompt' => $prompt->prompt,
                'created_at' => $prompt->created_at,
            ] : null,
            'memories' => MemoryResource::collection($memories),
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
}
