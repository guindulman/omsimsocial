<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\FriendRequestResource;
use App\Models\FriendRequest;
use App\Models\User;
use App\Services\FriendshipService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FriendRequestController extends Controller
{
    public function store(Request $request, FriendshipService $friendshipService)
    {
        $validator = Validator::make($request->all(), [
            'to_user_id' => ['required', 'integer'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('validation_failed', $validator->errors()->first(), 422);
        }

        $user = $request->user();
        $toUserId = (int) $request->input('to_user_id');

        if ($toUserId === $user->id) {
            return $this->errorResponse('self_request', 'Cannot friend yourself.', 422);
        }

        $target = User::query()->find($toUserId);
        if (! $target) {
            return $this->errorResponse('user_not_found', 'User not found.', 404);
        }

        if (! $target->is_active) {
            return $this->errorResponse('target_inactive', 'User is inactive.', 403);
        }

        if ($friendshipService->exists($user->id, $toUserId)) {
            return $this->errorResponse('already_friends', 'Users are already friends.', 409);
        }

        $pendingExists = FriendRequest::query()
            ->where('status', 'pending')
            ->where(function ($query) use ($user, $toUserId) {
                $query->where('from_user_id', $user->id)
                    ->where('to_user_id', $toUserId)
                    ->orWhere(function ($inner) use ($user, $toUserId) {
                        $inner->where('from_user_id', $toUserId)
                            ->where('to_user_id', $user->id);
                    });
            })
            ->exists();

        if ($pendingExists) {
            return $this->errorResponse('request_pending', 'A pending request already exists.', 409);
        }

        $friendRequest = $friendshipService->requestFriend(
            $user->id,
            $toUserId,
            $request->input('message')
        );

        return response()->json([
            'request' => FriendRequestResource::make($friendRequest->load(['fromUser.profile', 'toUser.profile'])),
        ], 201);
    }

    public function incoming(Request $request)
    {
        $user = $request->user();

        $requests = FriendRequest::query()
            ->where('to_user_id', $user->id)
            ->where('status', 'pending')
            ->latest()
            ->with(['fromUser.profile', 'toUser.profile'])
            ->get();

        return response()->json([
            'data' => FriendRequestResource::collection($requests),
        ]);
    }

    public function outgoing(Request $request)
    {
        $user = $request->user();

        $requests = FriendRequest::query()
            ->where('from_user_id', $user->id)
            ->where('status', 'pending')
            ->latest()
            ->with(['fromUser.profile', 'toUser.profile'])
            ->get();

        return response()->json([
            'data' => FriendRequestResource::collection($requests),
        ]);
    }

    public function confirm(Request $request, int $id, FriendshipService $friendshipService)
    {
        $user = $request->user();

        $friendRequest = FriendRequest::query()->find($id);
        if (! $friendRequest) {
            return $this->errorResponse('request_not_found', 'Friend request not found.', 404);
        }

        if ($friendRequest->to_user_id !== $user->id) {
            return $this->errorResponse('not_recipient', 'Only the recipient can confirm.', 403);
        }

        if ($friendRequest->status !== 'pending') {
            return $this->errorResponse('request_not_pending', 'Friend request is not pending.', 409);
        }

        if ($friendshipService->exists($friendRequest->from_user_id, $friendRequest->to_user_id)) {
            return $this->errorResponse('already_friends', 'Users are already friends.', 409);
        }

        $friendshipService->acceptRequest($friendRequest);

        return response()->json([
            'request' => FriendRequestResource::make($friendRequest->load(['fromUser.profile', 'toUser.profile'])),
        ]);
    }

    public function decline(Request $request, int $id, FriendshipService $friendshipService)
    {
        $user = $request->user();

        $friendRequest = FriendRequest::query()->find($id);
        if (! $friendRequest) {
            return $this->errorResponse('request_not_found', 'Friend request not found.', 404);
        }

        if ($friendRequest->to_user_id !== $user->id) {
            return $this->errorResponse('not_recipient', 'Only the recipient can decline.', 403);
        }

        if ($friendRequest->status !== 'pending') {
            return $this->errorResponse('request_not_pending', 'Friend request is not pending.', 409);
        }

        $friendshipService->declineRequest($friendRequest);

        return response()->json([
            'request' => FriendRequestResource::make($friendRequest->load(['fromUser.profile', 'toUser.profile'])),
        ]);
    }

    public function cancel(Request $request, int $id, FriendshipService $friendshipService)
    {
        $user = $request->user();

        $friendRequest = FriendRequest::query()->find($id);
        if (! $friendRequest) {
            return $this->errorResponse('request_not_found', 'Friend request not found.', 404);
        }

        if ($friendRequest->from_user_id !== $user->id) {
            return $this->errorResponse('not_sender', 'Only the requester can cancel.', 403);
        }

        if ($friendRequest->status !== 'pending') {
            return $this->errorResponse('request_not_pending', 'Friend request is not pending.', 409);
        }

        $friendshipService->cancelRequest($friendRequest);

        return response()->json([
            'request' => FriendRequestResource::make($friendRequest->load(['fromUser.profile', 'toUser.profile'])),
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
