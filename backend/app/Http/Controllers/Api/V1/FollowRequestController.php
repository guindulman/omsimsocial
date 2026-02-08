<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\FollowRequestResource;
use App\Models\Follow;
use App\Models\FollowRequest;
use App\Services\FollowService;
use Illuminate\Http\Request;

class FollowRequestController extends Controller
{
    public function incoming(Request $request)
    {
        $user = $request->user();

        $requests = FollowRequest::query()
            ->where('target_id', $user->id)
            ->where('status', 'pending')
            ->latest()
            ->with(['requester.profile', 'target.profile'])
            ->get();

        return response()->json([
            'data' => FollowRequestResource::collection($requests),
        ]);
    }

    public function outgoing(Request $request)
    {
        $user = $request->user();

        $requests = FollowRequest::query()
            ->where('requester_id', $user->id)
            ->where('status', 'pending')
            ->latest()
            ->with(['requester.profile', 'target.profile'])
            ->get();

        return response()->json([
            'data' => FollowRequestResource::collection($requests),
        ]);
    }

    public function accept(Request $request, int $id, FollowService $followService)
    {
        $user = $request->user();

        $followRequest = FollowRequest::query()->find($id);
        if (! $followRequest) {
            return $this->errorResponse('follow_request_not_found', 'Follow request not found.', 404);
        }

        if ($followRequest->target_id !== $user->id) {
            return $this->errorResponse('not_recipient', 'Only the recipient can accept.', 403);
        }

        if ($followRequest->status !== 'pending') {
            return $this->errorResponse('follow_request_not_pending', 'Follow request is not pending.', 409);
        }

        $alreadyFollowing = Follow::query()
            ->where('follower_id', $followRequest->requester_id)
            ->where('following_id', $followRequest->target_id)
            ->exists();

        if ($alreadyFollowing) {
            return $this->errorResponse('already_following', 'Already following this user.', 409);
        }

        $followService->acceptRequest($followRequest);

        return response()->json([
            'status' => 'following',
            'request' => FollowRequestResource::make($followRequest->load(['requester.profile', 'target.profile'])),
        ]);
    }

    public function decline(Request $request, int $id, FollowService $followService)
    {
        $user = $request->user();

        $followRequest = FollowRequest::query()->find($id);
        if (! $followRequest) {
            return $this->errorResponse('follow_request_not_found', 'Follow request not found.', 404);
        }

        if ($followRequest->target_id !== $user->id) {
            return $this->errorResponse('not_recipient', 'Only the recipient can decline.', 403);
        }

        if ($followRequest->status !== 'pending') {
            return $this->errorResponse('follow_request_not_pending', 'Follow request is not pending.', 409);
        }

        $followService->declineRequest($followRequest);

        return response()->json([
            'request' => FollowRequestResource::make($followRequest->load(['requester.profile', 'target.profile'])),
        ]);
    }

    public function cancel(Request $request, int $id, FollowService $followService)
    {
        $user = $request->user();

        $followRequest = FollowRequest::query()->find($id);
        if (! $followRequest) {
            return $this->errorResponse('follow_request_not_found', 'Follow request not found.', 404);
        }

        if ($followRequest->requester_id !== $user->id) {
            return $this->errorResponse('not_sender', 'Only the requester can cancel.', 403);
        }

        if ($followRequest->status !== 'pending') {
            return $this->errorResponse('follow_request_not_pending', 'Follow request is not pending.', 409);
        }

        $followService->cancelRequest($followRequest);

        return response()->json([
            'request' => FollowRequestResource::make($followRequest->load(['requester.profile', 'target.profile'])),
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
