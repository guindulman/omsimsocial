<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateTimeCapsuleRequest;
use App\Http\Resources\TimeCapsuleResource;
use App\Models\CircleMember;
use App\Models\Memory;
use App\Models\TimeCapsule;
use App\Models\TimeCapsuleItem;
use App\Services\FriendshipService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TimeCapsuleController extends Controller
{
    public function store(CreateTimeCapsuleRequest $request, FriendshipService $friendshipService)
    {
        $user = $request->user();
        $scope = $request->input('scope') ?: 'private';

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
                    'message' => 'Direct time capsules require a friend.',
                ], 403);
            }
        }

        $memoryIds = collect($request->input('memory_ids'))->unique()->values();

        $memories = Memory::query()->whereIn('id', $memoryIds)->get();
        foreach ($memories as $memory) {
            $this->authorize('view', $memory);
        }

        $timeCapsule = DB::transaction(function () use ($request, $user, $scope, $memoryIds) {
            $capsule = TimeCapsule::query()->create([
                'owner_id' => $user->id,
                'unlock_at' => Carbon::parse($request->input('unlock_at')),
                'scope' => $scope,
                'circle_id' => $circleId,
                'direct_user_id' => $directUserId,
                'title' => $request->input('title'),
            ]);

            foreach ($memoryIds as $memoryId) {
                TimeCapsuleItem::query()->create([
                    'time_capsule_id' => $capsule->id,
                    'memory_id' => $memoryId,
                ]);
            }

            return $capsule;
        });

        return response()->json([
            'time_capsule' => TimeCapsuleResource::make($timeCapsule->load('items')),
        ], 201);
    }

    public function index(Request $request)
    {
        $timeCapsules = TimeCapsule::query()
            ->where('owner_id', $request->user()->id)
            ->with('items')
            ->latest()
            ->get();

        return response()->json([
            'data' => TimeCapsuleResource::collection($timeCapsules),
        ]);
    }

    public function show(Request $request, TimeCapsule $timeCapsule)
    {
        if ($timeCapsule->owner_id !== $request->user()->id) {
            return response()->json([
                'code' => 'forbidden',
                'message' => 'Forbidden.',
            ], 403);
        }

        return response()->json([
            'time_capsule' => TimeCapsuleResource::make($timeCapsule->load('items')),
        ]);
    }
}
