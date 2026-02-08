<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $payload = $request->validated();

        $user = User::query()->create([
            'name' => $payload['name'],
            'username' => $payload['username'],
            'email' => $payload['email'] ?? null,
            'phone' => $payload['phone'] ?? null,
            'password' => Hash::make($payload['password']),
        ]);

        Profile::query()->create([
            'user_id' => $user->id,
            'privacy_prefs' => [
                'show_city' => true,
                'allow_invites' => true,
            ],
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $identifier = $request->input('identifier');

        $user = User::query()
            ->where('email', $identifier)
            ->orWhere('username', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'code' => 'invalid_credentials',
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'code' => 'account_inactive',
                'message' => 'Account is inactive.',
            ], 403);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => UserResource::make($request->user()->load('profile')),
        ]);
    }
}
