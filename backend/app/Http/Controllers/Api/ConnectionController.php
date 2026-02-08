<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Connection;
use App\Models\User;
use App\Services\ConnectionService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class ConnectionController extends Controller
{
    public function createQr(Request $request)
    {
        $user = $request->user();
        $token = Str::random(40);
        $expiresAt = Carbon::now()->addMinutes(5);

        Cache::put('handshake:'.$token, $user->id, $expiresAt);

        return response()->json([
            'token' => $token,
            'expires_at' => $expiresAt,
        ], 201);
    }

    public function claimQr(Request $request, ConnectionService $connectionService)
    {
        $request->validate([
            'token' => ['required', 'string'],
        ]);

        $user = $request->user();
        $token = $request->string('token');
        $inviterId = Cache::pull('handshake:'.$token->toString());

        if (! $inviterId) {
            return response()->json(['message' => 'Invalid or expired token.'], 404);
        }

        if ($inviterId === $user->id) {
            return response()->json(['message' => 'Cannot connect to yourself.'], 422);
        }

        $this->createConnection($connectionService, $user->id, (int) $inviterId, 'qr');

        return response()->json(['message' => 'Handshake completed.']);
    }

    public function claimNfc(Request $request, ConnectionService $connectionService)
    {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $user = $request->user();
        $targetId = (int) $data['user_id'];

        if ($targetId === $user->id) {
            return response()->json(['message' => 'Cannot connect to yourself.'], 422);
        }

        $this->createConnection($connectionService, $user->id, $targetId, 'nfc');

        return response()->json(['message' => 'Handshake completed.']);
    }

    public function locationPing(Request $request)
    {
        $request->validate([
            'geohash' => ['sometimes', 'nullable', 'string'],
        ]);

        return response()->json(['message' => 'Location received.']);
    }

    public function nearby()
    {
        return response()->json([
            'users' => [],
        ]);
    }

    public function listConnections(Request $request)
    {
        $userId = $request->user()->id;

        $connections = Connection::query()
            ->where('user_a_id', $userId)
            ->orWhere('user_b_id', $userId)
            ->get();

        $otherIds = $connections->map(function (Connection $connection) use ($userId) {
            return $connection->user_a_id === $userId
                ? $connection->user_b_id
                : $connection->user_a_id;
        })->filter()->values();

        $users = User::query()
            ->whereIn('id', $otherIds)
            ->with('profile')
            ->get();

        return response()->json([
            'connections' => UserResource::collection($users),
        ]);
    }

    protected function createConnection(ConnectionService $connectionService, int $userId, int $targetId, string $method): void
    {
        [$userA, $userB] = $connectionService->normalizePair($userId, $targetId);

        Connection::query()->firstOrCreate(
            ['user_a_id' => $userA, 'user_b_id' => $userB],
            ['method' => $method]
        );
    }
}
