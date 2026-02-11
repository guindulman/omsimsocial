<?php

namespace Tests\Feature;

use App\Models\Memory;
use App\Models\User;
use App\Services\Moderation\GoogleVisionSafeSearch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Mockery\MockInterface;
use Tests\TestCase;

class MemoryMediaModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_image_post_upload_continues_when_moderation_service_is_unavailable(): void
    {
        config([
            'moderation.enabled' => true,
            'moderation.provider' => 'google_vision',
            'moderation.fail_closed' => true,
        ]);

        Storage::fake('public');
        $user = User::factory()->create();
        $memory = Memory::query()->create([
            'author_id' => $user->id,
            'scope' => 'private',
            'body' => 'Testing upload',
        ]);

        Sanctum::actingAs($user);

        $this->mock(GoogleVisionSafeSearch::class, function (MockInterface $mock): void {
            $mock->shouldReceive('detect')
                ->once()
                ->andThrow(new \RuntimeException('Google Vision timeout'));
        });

        $response = $this->post('/api/v1/memories/'.$memory->id.'/media', [
            'type' => 'image',
            'file' => $this->fakePngImage(),
        ]);

        $response->assertCreated();
        $this->assertCount(1, $memory->fresh()->media);
    }

    public function test_image_post_upload_still_blocks_explicit_content_when_moderation_responds(): void
    {
        config([
            'moderation.enabled' => true,
            'moderation.provider' => 'google_vision',
            'moderation.fail_closed' => true,
        ]);

        Storage::fake('public');
        $user = User::factory()->create();
        $memory = Memory::query()->create([
            'author_id' => $user->id,
            'scope' => 'private',
            'body' => 'Testing upload',
        ]);

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

        $response = $this->post('/api/v1/memories/'.$memory->id.'/media', [
            'type' => 'image',
            'file' => $this->fakePngImage(),
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'explicit_content_blocked');

        $this->assertCount(0, $memory->fresh()->media);
    }

    private function fakePngImage(): UploadedFile
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+f2QAAAAASUVORK5CYII=', true);

        return UploadedFile::fake()->createWithContent('photo.png', $png ?: 'png');
    }
}

