<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Profile;
use App\Models\ProfileSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::query()->create([
            'name' => $request->string('name'),
            'username' => $request->string('username'),
            'email' => $request->input('email'),
            'phone' => $request->input('phone'),
            'password' => Hash::make($request->input('password')),
        ]);

        Profile::query()->create([
            'user_id' => $user->id,
            'cover_type' => 'image',
            'accent_color' => 'auto',
            'layout_style' => 'minimal',
        ]);

        ProfileSetting::query()->create([
            'user_id' => $user->id,
            'profile_visibility' => 'public',
            'share_profile_views' => false,
            'show_city' => true,
            'show_links' => true,
            'allow_invites_from' => 'everyone',
            'allow_calls_from' => 'connections',
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user->load(['profile', 'profileSettings'])),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $identifier = $request->string('identifier')->toString();

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
            'user' => UserResource::make($user->load(['profile', 'profileSettings'])),
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
        $user = $request->user()->load(['profile', 'profileSettings']);

        return response()->json([
            'user' => UserResource::make($user),
        ]);
    }
}
