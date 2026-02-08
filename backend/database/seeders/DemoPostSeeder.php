<?php

namespace Database\Seeders;

use App\Models\Adoption;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DemoPostSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::query()->take(3)->get();

        foreach ($users as $index => $user) {
            $post = Post::query()->create([
                'user_id' => $user->id,
                'caption' => 'Demo post #'.($index + 1),
                'status' => $index === 2 ? 'gem' : 'vip',
                'visibility_scope' => 'public',
                'vip_until' => Carbon::now()->addHours(2),
                'expires_at' => Carbon::now()->addHours(24),
                'adopted_count' => 0,
                'clarify_count' => 0,
            ]);

            PostMedia::query()->create([
                'post_id' => $post->id,
                'type' => 'image',
                'url' => 'https://example.com/media/'.$post->id.'.jpg',
                'thumb_url' => 'https://example.com/media/'.$post->id.'-thumb.jpg',
                'order_index' => 0,
            ]);
        }

        if ($users->count() >= 2) {
            $originalPost = Post::query()->first();

            if ($originalPost) {
                Adoption::query()->create([
                    'original_post_id' => $originalPost->id,
                    'adopter_user_id' => $users[1]->id,
                    'adoption_type' => 'continue',
                    'contribution_text' => 'Added a continuation thread for the demo.',
                ]);

                $originalPost->increment('adopted_count');
            }
        }
    }
}
