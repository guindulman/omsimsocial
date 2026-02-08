<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\FollowRequestResource;
use App\Http\Resources\UserResource;
use App\Models\Follow;
use App\Models\FollowRequest;
use App\Models\User;
use App\Services\FollowService;
use Illuminate\Http\Request;

class FollowController extends Controller
{
    public function store(Request $request, User $user, FollowService $followService)
    {
        $viewer = $request->user();

        if ($viewer->id === $user->id) {
            return $this->errorResponse('self_follow', 'You cannot follow yourself.', 422);
        }

        if (! $user->is_active) {
            return $this->errorResponse('target_inactive', 'User is inactive.', 403);
        }

        if ($followService->isFollowing($viewer->id, $user->id)) {
            return $this->errorResponse('already_following', 'Already following this user.', 409);
        }

        if ($user->is_private) {
            $pendingRequest = FollowRequest::query()
                ->where('requester_id', $viewer->id)
                ->where('target_id', $user->id)
                ->where('status', 'pending')
                ->exists();

            if ($pendingRequest) {
                return $this->errorResponse('follow_request_pending', 'Follow request already pending.', 409);
            }

            $followRequest = $followService->createFollowRequest($viewer, $user);

            return response()->json([
                'status' => 'requested',
                'request' => FollowRequestResource::make($followRequest->load(['requester.profile', 'target.profile'])),
            ], 201);
        }

        $followService->createFollow($viewer, $user);

        return response()->json([
            'status' => 'following',
        ], 201);
    }

    public function destroy(Request $request, User $user, FollowService $followService)
    {
        $viewer = $request->user();

        $exists = Follow::query()
            ->where('follower_id', $viewer->id)
            ->where('following_id', $user->id)
            ->exists();

        if (! $exists) {
            return $this->errorResponse('follow_not_found', 'Follow not found.', 404);
        }

        $followService->unfollow($viewer, $user);

        return response()->json([
            'status' => 'unfollowed',
        ]);
    }

    public function followers(Request $request, User $user)
    {
        $viewer = $request->user();
        $user->loadMissing('profile');
        $prefs = $user->profile?->privacy_prefs ?? [];
        $showFollowers = data_get($prefs, 'show_followers', true);

        if ($viewer && $viewer->id !== $user->id && $showFollowers === false) {
            return $this->errorResponse('followers_private', 'Followers list is private.', 403);
        }

        $followers = User::query()
            ->whereIn('id', Follow::query()->where('following_id', $user->id)->pluck('follower_id'))
            ->with('profile')
            ->get();

        return response()->json([
            'data' => UserResource::collection($followers),
        ]);
    }

    public function following(Request $request, User $user)
    {
        $viewer = $request->user();
        $user->loadMissing('profile');
        $prefs = $user->profile?->privacy_prefs ?? [];
        $showFollowing = data_get($prefs, 'show_following', true);

        if ($viewer && $viewer->id !== $user->id && $showFollowing === false) {
            return $this->errorResponse('following_private', 'Following list is private.', 403);
        }

        $following = User::query()
            ->whereIn('id', Follow::query()->where('follower_id', $user->id)->pluck('following_id'))
            ->with('profile')
            ->get();

        return response()->json([
            'data' => UserResource::collection($following),
        ]);
    }

    protected function errorResponse(string $code, string $message, int $status)
    {
        return response()->json([
            'code' => $code,
            'message' => $message,
        ], $status);
    }
}
