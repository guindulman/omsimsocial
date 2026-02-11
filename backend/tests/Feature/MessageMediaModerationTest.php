<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use App\Services\Moderation\GoogleVisionSafeSearch;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Mockery\MockInterface;
use Tests\TestCase;

class MessageMediaModerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_chat_image_upload_continues_when_moderation_service_is_unavailable(): void
    {
        config([
            'moderation.enabled' => true,
            'moderation.provider' => 'google_vision',
            'moderation.fail_closed' => true,
        ]);

        Storage::fake('public');

        [$sender, $recipient] = $this->createFriends();
        Sanctum::actingAs($sender);

        $this->mock(GoogleVisionSafeSearch::class, function (MockInterface $mock): void {
            $mock->shouldReceive('detect')
                ->once()
                ->andThrow(new \RuntimeException('Google Vision timeout'));
        });

        $response = $this->post('/api/v1/messages', [
            'recipient_id' => $recipient->id,
            'file' => $this->fakePngImage(),
        ]);

        $response->assertCreated()
            ->assertJsonPath('message.media_type', 'image');

        $this->assertDatabaseCount('messages', 1);
        $this->assertNotNull(Message::query()->first()?->media_url);
    }

    public function test_chat_image_upload_still_blocks_explicit_content_when_moderation_responds(): void
    {
        config([
            'moderation.enabled' => true,
            'moderation.provider' => 'google_vision',
            'moderation.fail_closed' => true,
        ]);

        Storage::fake('public');

        [$sender, $recipient] = $this->createFriends();
        Sanctum::actingAs($sender);

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

        $response = $this->post('/api/v1/messages', [
            'recipient_id' => $recipient->id,
            'file' => $this->fakePngImage(),
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('code', 'explicit_content_blocked');

        $this->assertDatabaseCount('messages', 0);
    }

    /**
     * @return array{0: User, 1: User}
     */
    private function createFriends(): array
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        Friendship::query()->create([
            'user_low_id' => min($sender->id, $recipient->id),
            'user_high_id' => max($sender->id, $recipient->id),
            'verified_at' => now(),
        ]);

        return [$sender, $recipient];
    }

    private function fakePngImage(): UploadedFile
    {
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+f2QAAAAASUVORK5CYII=', true);

        return UploadedFile::fake()->createWithContent('chat.png', $png ?: 'png');
    }
}

