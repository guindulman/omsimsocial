<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\Moderation\GoogleVisionSafeSearch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Mockery\MockInterface;
use Tests\TestCase;

class AccountAvatarModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_avatar_upload_continues_when_moderation_service_is_unavailable(): void
    {
        config([
            'moderation.enabled' => true,
            'moderation.provider' => 'google_vision',
            'moderation.fail_closed' => true,
        ]);

        Storage::fake('public');
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->mock(GoogleVisionSafeSearch::class, function (MockInterface $mock): void {
            $mock->shouldReceive('detect')
                ->once()
                ->andThrow(new \RuntimeException('Google Vision timeout'));
        });

        $response = $this->post('/api/v1/account/avatar', [
            'file' => UploadedFile::fake()->create('avatar.jpg', 128, 'image/jpeg'),
        ]);

        $response->assertOk();

        $avatarUrl = $user->fresh()->profile?->avatar_url;
        $this->assertNotNull($avatarUrl);
        $this->assertStringContainsString('/storage/profiles/'.$user->id.'/avatar/', $avatarUrl);
    }

    public function test_avatar_upload_still_blocks_explicit_content_when_moderation_responds(): void
    {
        config([
            'moderation.enabled' => true,
            'moderation.provider' => 'google_vision',
            'moderation.fail_closed' => true,
        ]);

        Storage::fake('public');
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->mock(GoogleVisionSafeSearch::class, function (MockInterface $mock): void {
            $mock->shouldReceive('detect')
                ->once()
                ->andReturn([
                    'annotation' => [
                        'adult' => 'VERY_LIKELY',
                        'racy' => 'VERY_UNLIKELY',
                        'violence' => 'VERY_UNLIKELY',
                    ],
                    'raw' => [],
                ]);
        });

        $response = $this->post('/api/v1/account/avatar', [
            'file' => UploadedFile::fake()->create('avatar.jpg', 128, 'image/jpeg'),
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'explicit_content_blocked');

        $this->assertNull($user->fresh()->profile?->avatar_url);
    }
}
