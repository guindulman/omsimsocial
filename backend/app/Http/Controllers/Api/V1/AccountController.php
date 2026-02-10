<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Profile;
use App\Services\Moderation\ImageModerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class AccountController extends Controller
{
    public function __construct(
        private readonly ImageModerationService $moderation,
    ) {}

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $payload = $request->validate([
            'name' => ['sometimes', 'string', 'min:2'],
            'username' => ['sometimes', 'string', 'min:2', 'unique:users,username,'.$user->id],
            'email' => ['sometimes', 'nullable', 'email', 'unique:users,email,'.$user->id],
            'phone' => ['sometimes', 'nullable', 'string', 'unique:users,phone,'.$user->id],
            'bio' => ['sometimes', 'nullable', 'string', 'max:120'],
            'city' => ['sometimes', 'nullable', 'string'],
            'website_url' => ['sometimes', 'nullable', 'string'],
            'birthday' => ['sometimes', 'nullable', 'date'],
            'gender' => ['sometimes', 'nullable', 'string'],
            'instagram_url' => ['sometimes', 'nullable', 'string'],
            'facebook_url' => ['sometimes', 'nullable', 'string'],
            'tiktok_url' => ['sometimes', 'nullable', 'string'],
            'avatar_url' => ['sometimes', 'nullable', 'string'],
            'cover_url' => ['sometimes', 'nullable', 'string'],
            'privacy_prefs' => ['sometimes', 'array'],
            'privacy_prefs.show_followers' => ['sometimes', 'boolean'],
            'privacy_prefs.show_following' => ['sometimes', 'boolean'],
            'privacy_prefs.notification_mentions' => ['sometimes', 'boolean'],
            'privacy_prefs.notification_direct_messages' => ['sometimes', 'boolean'],
            'privacy_prefs.notification_follows' => ['sometimes', 'boolean'],
            'privacy_prefs.quiet_hours_enabled' => ['sometimes', 'boolean'],
            'privacy_prefs.quiet_hours_start' => ['sometimes', 'integer', 'min:0', 'max:23'],
            'privacy_prefs.quiet_hours_end' => ['sometimes', 'integer', 'min:0', 'max:23'],
        ]);

        $email = array_key_exists('email', $payload) ? $payload['email'] : $user->email;
        $phone = array_key_exists('phone', $payload) ? $payload['phone'] : $user->phone;

        $user->fill([
            'name' => $payload['name'] ?? $user->name,
            'username' => $payload['username'] ?? $user->username,
            'email' => $email,
            'phone' => $phone,
        ]);

        if ($email !== $user->getOriginal('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        $profile = Profile::query()->firstOrNew(['user_id' => $user->id]);
        $profile->fill([
            'bio' => $payload['bio'] ?? $profile->bio,
            'city' => $payload['city'] ?? $profile->city,
            'website_url' => $payload['website_url'] ?? $profile->website_url,
            'birthday' => $payload['birthday'] ?? $profile->birthday,
            'gender' => $payload['gender'] ?? $profile->gender,
            'instagram_url' => $payload['instagram_url'] ?? $profile->instagram_url,
            'facebook_url' => $payload['facebook_url'] ?? $profile->facebook_url,
            'tiktok_url' => $payload['tiktok_url'] ?? $profile->tiktok_url,
            'avatar_url' => $payload['avatar_url'] ?? $profile->avatar_url,
            'cover_url' => $payload['cover_url'] ?? $profile->cover_url,
        ]);
        if (array_key_exists('privacy_prefs', $payload)) {
            $currentPrefs = $profile->privacy_prefs;
            if (! is_array($currentPrefs)) {
                $currentPrefs = [];
            }
            $profile->privacy_prefs = array_merge($currentPrefs, $payload['privacy_prefs'] ?? []);
        }
        $profile->save();

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
        ]);
    }

    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $payload = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if (! Hash::check($payload['current_password'], $user->password)) {
            return response()->json([
                'code' => 'password_incorrect',
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $user->password = Hash::make($payload['password']);
        $user->save();

        return response()->json(['message' => 'Password updated.']);
    }

    public function uploadAvatar(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'file' => ['required', 'image', 'max:5120'],
        ]);

        $file = $request->file('file');
        $decision = $this->moderation->moderate($file);
        if (! ($decision['allowed'] ?? false)) {
            return response()->json([
                'code' => $decision['code'] ?? 'explicit_content_blocked',
                'message' => $decision['message'] ?? 'Upload rejected.',
            ], 422);
        }

        $disk = 'public';
        $path = $file->storePublicly("profiles/{$user->id}/avatar", [
            'disk' => $disk,
        ]);

        $profile = Profile::query()->firstOrNew(['user_id' => $user->id]);
        $profile->avatar_url = Storage::disk($disk)->url($path);
        $profile->save();

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
        ]);
    }

    public function uploadCover(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'file' => ['required', 'image', 'max:5120'],
        ]);

        $file = $request->file('file');
        $decision = $this->moderation->moderate($file);
        if (! ($decision['allowed'] ?? false)) {
            return response()->json([
                'code' => $decision['code'] ?? 'explicit_content_blocked',
                'message' => $decision['message'] ?? 'Upload rejected.',
            ], 422);
        }

        $disk = 'public';
        $path = $file->storePublicly("profiles/{$user->id}/cover", [
            'disk' => $disk,
        ]);

        $profile = Profile::query()->firstOrNew(['user_id' => $user->id]);
        $profile->cover_url = Storage::disk($disk)->url($path);
        $profile->save();

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
        ]);
    }

    public function updateSettings(Request $request)
    {
        $user = $request->user();

        $payload = $request->validate([
            'is_private' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (array_key_exists('is_private', $payload)) {
            $user->is_private = (bool) $payload['is_private'];
        }

        if (array_key_exists('is_active', $payload)) {
            $user->is_active = (bool) $payload['is_active'];
        }

        $user->save();

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
        ]);
    }
}
