<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Friendship;
use App\Models\User;
use App\Services\FriendshipService;
use Illuminate\Http\Request;

class FriendshipController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $friendships = Friendship::query()
            ->where('user_low_id', $user->id)
            ->orWhere('user_high_id', $user->id)
            ->get();

        $friendIds = $friendships->map(function (Friendship $friendship) use ($user) {
            return $friendship->user_low_id === $user->id
                ? $friendship->user_high_id
                : $friendship->user_low_id;
        });

        $friends = User::query()
            ->whereIn('id', $friendIds)
            ->with('profile')
            ->get()
            ->keyBy('id');

        $data = $friendships->map(function (Friendship $friendship) use ($friends, $user) {
            $otherId = $friendship->user_low_id === $user->id
                ? $friendship->user_high_id
                : $friendship->user_low_id;

            return [
                'id' => $friendship->id,
                'verified_at' => $friendship->verified_at,
                'created_at' => $friendship->created_at,
                'user' => UserResource::make($friends->get($otherId)),
            ];
        })->values();

        return response()->json([
            'data' => $data,
        ]);
    }

    public function destroy(Request $request, User $user, FriendshipService $friendshipService)
    {
        $viewer = $request->user();

        if ($viewer->id === $user->id) {
            return $this->errorResponse('self_unfriend', 'Cannot unfriend yourself.', 422);
        }

        if (! $friendshipService->exists($viewer->id, $user->id)) {
            return $this->errorResponse('friendship_not_found', 'Friendship not found.', 404);
        }

        $friendshipService->unfriend($viewer->id, $user->id);

        return response()->json([
            'message' => 'Unfriended.',
        ]);
    }

    public function verify(Request $request, User $user, FriendshipService $friendshipService)
    {
        $viewer = $request->user();

        if ($viewer->id === $user->id) {
            return $this->errorResponse('self_verify', 'Cannot verify yourself.', 422);
        }

        $friendship = $friendshipService->verifyFriendship($viewer->id, $user->id);

        if (! $friendship) {
            return $this->errorResponse('friendship_not_found', 'Friendship not found.', 404);
        }

        return response()->json([
            'friendship' => [
                'id' => $friendship->id,
                'verified_at' => $friendship->verified_at,
            ],
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
