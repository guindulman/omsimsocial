<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConnectionRequestResource;
use App\Http\Resources\ConnectionResource;
use App\Models\ConnectionRequest;
use App\Models\User;
use App\Services\ConnectionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class ConnectRequestController extends Controller
{
    public function store(Request $request, ConnectionService $connectionService)
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
            return $this->errorResponse('self_request', 'Cannot connect to yourself.', 422);
        }

        $target = User::query()->find($toUserId);
        if (! $target) {
            return $this->errorResponse('user_not_found', 'User not found.', 404);
        }

        if ($connectionService->exists($user->id, $toUserId)) {
            return $this->errorResponse('already_connected', 'Users are already connected.', 409);
        }

        $pendingExists = ConnectionRequest::query()
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

        $connectionRequest = ConnectionRequest::query()->create([
            'from_user_id' => $user->id,
            'to_user_id' => $toUserId,
            'message' => $request->input('message'),
        ]);

        return response()->json([
            'request' => ConnectionRequestResource::make($connectionRequest->load(['fromUser.profile', 'toUser.profile'])),
        ], 201);
    }

    public function incoming(Request $request)
    {
        $user = $request->user();

        $requests = ConnectionRequest::query()
            ->where('to_user_id', $user->id)
            ->where('status', 'pending')
            ->latest()
            ->with(['fromUser.profile', 'toUser.profile'])
            ->get();

        return response()->json([
            'data' => ConnectionRequestResource::collection($requests),
        ]);
    }

    public function outgoing(Request $request)
    {
        $user = $request->user();

        $requests = ConnectionRequest::query()
            ->where('from_user_id', $user->id)
            ->where('status', 'pending')
            ->latest()
            ->with(['fromUser.profile', 'toUser.profile'])
            ->get();

        return response()->json([
            'data' => ConnectionRequestResource::collection($requests),
        ]);
    }

    public function accept(Request $request, int $id, ConnectionService $connectionService)
    {
        $user = $request->user();

        $connectionRequest = ConnectionRequest::query()->find($id);
        if (! $connectionRequest) {
            return $this->errorResponse('request_not_found', 'Connection request not found.', 404);
        }

        if ($connectionRequest->to_user_id !== $user->id) {
            return $this->errorResponse('not_recipient', 'Only the recipient can accept.', 403);
        }

        if ($connectionRequest->status !== 'pending') {
            return $this->errorResponse('request_not_pending', 'Connection request is not pending.', 409);
        }

        if ($connectionService->exists($connectionRequest->from_user_id, $connectionRequest->to_user_id)) {
            return $this->errorResponse('already_connected', 'Users are already connected.', 409);
        }

        $connection = null;
        DB::transaction(function () use ($connectionRequest, $connectionService, &$connection) {
            $connectionRequest->update(['status' => 'accepted']);
            $connection = $connectionService->create(
                $connectionRequest->from_user_id,
                $connectionRequest->to_user_id,
                $connectionRequest->from_user_id,
                $connectionRequest->to_user_id
            );
        });

        return response()->json([
            'request' => ConnectionRequestResource::make($connectionRequest->load(['fromUser.profile', 'toUser.profile'])),
            'connection' => $connection
                ? ConnectionResource::make($connection->load(['requester.profile', 'addressee.profile']))
                : null,
        ]);
    }

    public function decline(Request $request, int $id)
    {
        $user = $request->user();

        $connectionRequest = ConnectionRequest::query()->find($id);
        if (! $connectionRequest) {
            return $this->errorResponse('request_not_found', 'Connection request not found.', 404);
        }

        if ($connectionRequest->to_user_id !== $user->id) {
            return $this->errorResponse('not_recipient', 'Only the recipient can decline.', 403);
        }

        if ($connectionRequest->status !== 'pending') {
            return $this->errorResponse('request_not_pending', 'Connection request is not pending.', 409);
        }

        $connectionRequest->update(['status' => 'declined']);

        return response()->json([
            'request' => ConnectionRequestResource::make($connectionRequest->load(['fromUser.profile', 'toUser.profile'])),
        ]);
    }

    public function cancel(Request $request, int $id)
    {
        $user = $request->user();

        $connectionRequest = ConnectionRequest::query()->find($id);
        if (! $connectionRequest) {
            return $this->errorResponse('request_not_found', 'Connection request not found.', 404);
        }

        if ($connectionRequest->from_user_id !== $user->id) {
            return $this->errorResponse('not_sender', 'Only the requester can cancel.', 403);
        }

        if ($connectionRequest->status !== 'pending') {
            return $this->errorResponse('request_not_pending', 'Connection request is not pending.', 409);
        }

        $connectionRequest->update(['status' => 'canceled']);

        return response()->json([
            'request' => ConnectionRequestResource::make($connectionRequest->load(['fromUser.profile', 'toUser.profile'])),
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
