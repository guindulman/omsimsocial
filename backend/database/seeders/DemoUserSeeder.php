<?php

namespace Database\Seeders;

use App\Models\Profile;
use App\Models\ProfileSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Nod Harper',
                'email' => 'nod@example.com',
                'city' => 'Manila',
                'country' => 'PH',
            ],
            [
                'name' => 'Snap Reyes',
                'email' => 'snap@example.com',
                'city' => 'Cebu',
                'country' => 'PH',
            ],
            [
                'name' => 'Jun Park',
                'email' => 'jun@example.com',
                'city' => 'Seoul',
                'country' => 'KR',
            ],
        ];

        foreach ($users as $payload) {
            $user = User::query()->create([
                'name' => $payload['name'],
                'email' => $payload['email'],
                'password' => Hash::make('password'),
            ]);

            Profile::query()->create([
                'user_id' => $user->id,
                'bio' => 'Demo profile for '.$payload['name'],
                'avatar_url' => 'https://example.com/avatars/'.$user->id.'.png',
                'cover_type' => 'gradient',
                'cover_value' => 'sunset',
                'city' => $payload['city'],
                'country' => $payload['country'],
                'language' => 'en',
                'links' => ['https://nodsnap.local/u/'.$user->id],
                'accent_color' => 'teal',
                'layout_style' => 'cards',
                'pinned_gem_post_ids' => [],
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
        }
    }
}
