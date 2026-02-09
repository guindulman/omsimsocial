<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserE2eeKey;
use App\Services\ConnectionService;
use App\Services\FriendshipService;
use Illuminate\Http\Request;

class E2eeKeyController extends Controller
{
    public function me(Request $request)
    {
        $user = $request->user();
        $key = UserE2eeKey::query()->where('user_id', $user->id)->first();

        return response()->json([
            'enabled' => (bool) config('e2ee.enabled'),
            'required' => (bool) config('e2ee.required'),
            'key' => $key ? [
                'user_id' => $key->user_id,
                'public_key' => $key->public_key,
                'algorithm' => $key->algorithm,
                'created_at' => $key->created_at,
                'updated_at' => $key->updated_at,
            ] : null,
        ]);
    }

    public function show(Request $request, User $user, FriendshipService $friendshipService, ConnectionService $connectionService)
    {
        $viewer = $request->user();

        if (! $friendshipService->exists($viewer->id, $user->id)) {
            return response()->json([
                'code' => 'messaging_requires_friendship',
                'message' => 'Messaging allowed only between friends.',
            ], 403);
        }

        if ($connectionService->isBlocked($viewer->id, $user->id)) {
            return response()->json([
                'code' => 'messaging_blocked',
                'message' => 'Messaging blocked.',
            ], 403);
        }

        $key = UserE2eeKey::query()->where('user_id', $user->id)->first();
        if (! $key) {
            return response()->json([
                'code' => 'e2ee_key_not_found',
                'message' => 'E2EE key not found for this user.',
            ], 404);
        }

        return response()->json([
            'user_id' => $key->user_id,
            'public_key' => $key->public_key,
            'algorithm' => $key->algorithm,
            'created_at' => $key->created_at,
            'updated_at' => $key->updated_at,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'public_key' => [
                'required',
                'string',
                'max:255',
                function (string $attribute, mixed $value, \Closure $fail) {
                    if (! is_string($value)) {
                        $fail('Invalid key.');
                        return;
                    }
                    $decoded = base64_decode($value, true);
                    if ($decoded === false) {
                        $fail('Invalid key.');
                        return;
                    }
                    if (strlen($decoded) !== 32) {
                        $fail('Invalid key length.');
                        return;
                    }
                },
            ],
            'algorithm' => ['nullable', 'string', 'max:50'],
        ]);

        $algorithm = $data['algorithm'] ?? 'nacl_box_v1';

        $key = UserE2eeKey::query()->updateOrCreate(
            ['user_id' => $user->id],
            ['public_key' => $data['public_key'], 'algorithm' => $algorithm]
        );

        return response()->json([
            'key' => [
                'user_id' => $key->user_id,
                'public_key' => $key->public_key,
                'algorithm' => $key->algorithm,
                'created_at' => $key->created_at,
                'updated_at' => $key->updated_at,
            ],
        ], 200);
    }
}

