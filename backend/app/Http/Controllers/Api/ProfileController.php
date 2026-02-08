<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProfileViewRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Requests\UpdateProfileSettingsRequest;
use App\Http\Resources\ProfileResource;
use App\Http\Resources\ProfileSettingResource;
use App\Http\Resources\ProfileViewResource;
use App\Models\Profile;
use App\Models\ProfileSetting;
use App\Models\ProfileView;
use App\Models\User;
use App\Services\ConnectionService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function show(Request $request, User $user, ConnectionService $connectionService)
    {
        $viewer = $request->user();

        $user->load(['profile', 'profileSettings']);

        $settings = $user->profileSettings;
        if ($viewer && $viewer->id !== $user->id && $settings?->profile_visibility === 'connections') {
            if (! $connectionService->isConnected($viewer->id, $user->id)) {
                return response()->json(['message' => 'Profile is only visible to connections.'], 403);
            }
        }

        $profile = $user->profile;
        if ($profile && (! $viewer || $viewer->id !== $user->id)) {
            if (! $settings?->show_city) {
                $profile->city = null;
            }
            if (! $settings?->show_links) {
                $profile->links = null;
            }
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
            ],
            'profile' => $profile ? ProfileResource::make($profile) : null,
            'settings' => $viewer && $viewer->id === $user->id
                ? ProfileSettingResource::make($settings)
                : null,
        ]);
    }

    public function update(UpdateProfileRequest $request)
    {
        $user = $request->user();

        $profile = Profile::query()->firstOrNew(['user_id' => $user->id]);
        $profile->fill($request->validated());
        $profile->save();

        return response()->json([
            'profile' => ProfileResource::make($profile),
        ]);
    }

    public function updateSettings(UpdateProfileSettingsRequest $request)
    {
        $user = $request->user();

        $settings = ProfileSetting::query()->firstOrNew(['user_id' => $user->id]);
        $settings->fill($request->validated());
        $settings->save();

        return response()->json([
            'settings' => ProfileSettingResource::make($settings),
        ]);
    }

    public function view(ProfileViewRequest $request, User $user)
    {
        $viewer = $request->user();

        if ($viewer && $viewer->id === $user->id) {
            return response()->json(['message' => 'Self views are ignored.']);
        }

        $viewerVisibility = $request->input('viewer_visibility', 'named');
        $viewerId = $viewerVisibility === 'anonymous' ? null : ($viewer?->id);

        $view = ProfileView::query()->create([
            'viewed_user_id' => $user->id,
            'viewer_user_id' => $viewerId,
            'viewer_visibility' => $viewerVisibility,
            'source' => $request->input('source'),
            'created_at' => Carbon::now(),
        ]);

        return response()->json([
            'view' => ProfileViewResource::make($view->load('viewerUser')),
        ], 201);
    }

    public function viewsSummary(Request $request)
    {
        $user = $request->user();
        $range = $request->query('range', '7d');
        $since = $this->rangeStart($range);

        $query = ProfileView::query()
            ->where('viewed_user_id', $user->id)
            ->where('created_at', '>=', $since);

        $total = (clone $query)->count();
        $named = (clone $query)->where('viewer_visibility', 'named')->count();
        $anonymous = (clone $query)->where('viewer_visibility', 'anonymous')->count();
        $uniqueViewers = (clone $query)
            ->whereNotNull('viewer_user_id')
            ->distinct('viewer_user_id')
            ->count('viewer_user_id');

        return response()->json([
            'range' => $range,
            'total' => $total,
            'named' => $named,
            'anonymous' => $anonymous,
            'unique_viewers' => $uniqueViewers,
        ]);
    }

    public function viewsList(Request $request)
    {
        $user = $request->user();
        $range = $request->query('range', '7d');
        $since = $this->rangeStart($range);

        $views = ProfileView::query()
            ->where('viewed_user_id', $user->id)
            ->where('created_at', '>=', $since)
            ->latest('created_at')
            ->with('viewerUser')
            ->get();

        return response()->json([
            'range' => $range,
            'views' => ProfileViewResource::collection($views),
        ]);
    }

    protected function rangeStart(string $range): Carbon
    {
        return match ($range) {
            '24h' => Carbon::now()->subHours(24),
            '30d' => Carbon::now()->subDays(30),
            default => Carbon::now()->subDays(7),
        };
    }
}
