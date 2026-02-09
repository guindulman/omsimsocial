<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_dm_requires_friendship(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        Sanctum::actingAs($sender);

        $blocked = $this->postJson('/api/v1/messages', [
            'recipient_id' => $recipient->id,
            'body' => 'Hello',
        ]);

        $blocked->assertForbidden();

        $low = min($sender->id, $recipient->id);
        $high = max($sender->id, $recipient->id);
        Friendship::query()->create([
            'user_low_id' => $low,
            'user_high_id' => $high,
            'verified_at' => now(),
        ]);

        $allowed = $this->postJson('/api/v1/messages', [
            'recipient_id' => $recipient->id,
            'body' => 'Hello again',
        ]);

        $allowed->assertCreated();
        $allowed->assertJsonPath('message.body', 'Hello again');

        $messageId = (int) $allowed->json('message.id');
        $message = Message::query()->findOrFail($messageId);
        $rawBody = $message->getRawOriginal('body');

        $this->assertIsString($rawBody);
        $this->assertStringStartsWith('enc:', $rawBody);
        $this->assertNotSame('Hello again', $rawBody);
    }
}
