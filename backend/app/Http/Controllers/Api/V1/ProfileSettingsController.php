<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileSettingsRequest;
use App\Http\Resources\ProfileSettingResource;
use App\Models\ProfileSetting;
use Illuminate\Http\Request;

class ProfileSettingsController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        $settings = ProfileSetting::query()->firstOrCreate([
            'user_id' => $user->id,
        ]);

        return response()->json([
            'settings' => ProfileSettingResource::make($settings),
        ]);
    }

    public function update(UpdateProfileSettingsRequest $request)
    {
        $user = $request->user();
        $payload = $request->validated();

        $settings = ProfileSetting::query()->firstOrNew([
            'user_id' => $user->id,
        ]);

        $settings->fill($payload);
        $settings->save();

        return response()->json([
            'settings' => ProfileSettingResource::make($settings),
        ]);
    }
}
