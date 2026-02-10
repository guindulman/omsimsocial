<?php

namespace Tests\Feature;

use App\Models\Friendship;
use App\Models\Message;
use App\Models\User;
use App\Models\UserE2eeKey;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class E2eeMessageTest extends TestCase
{
    use RefreshDatabase;

    public function test_dm_e2ee_required_rejects_plaintext_body(): void
    {
        config()->set('e2ee.enabled', true);
        config()->set('e2ee.required', true);

        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $low = min($sender->id, $recipient->id);
        $high = max($sender->id, $recipient->id);
        Friendship::query()->create([
            'user_low_id' => $low,
            'user_high_id' => $high,
            'verified_at' => now(),
        ]);

        UserE2eeKey::query()->create([
            'user_id' => $sender->id,
            'public_key' => base64_encode(random_bytes(32)),
            'algorithm' => 'nacl_box_v1',
        ]);
        UserE2eeKey::query()->create([
            'user_id' => $recipient->id,
            'public_key' => base64_encode(random_bytes(32)),
            'algorithm' => 'nacl_box_v1',
        ]);

        Sanctum::actingAs($sender);

        $blocked = $this->postJson('/api/v1/messages', [
            'recipient_id' => $recipient->id,
            'body' => 'Hello',
        ]);

        $blocked->assertStatus(422);
        $blocked->assertJsonPath('code', 'e2ee_required');
    }

    public function test_dm_e2ee_stores_ciphertext_and_returns_payload(): void
    {
        config()->set('e2ee.enabled', true);
        config()->set('e2ee.required', true);

        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $low = min($sender->id, $recipient->id);
        $high = max($sender->id, $recipient->id);
        Friendship::query()->create([
            'user_low_id' => $low,
            'user_high_id' => $high,
            'verified_at' => now(),
        ]);

        $senderKey = UserE2eeKey::query()->create([
            'user_id' => $sender->id,
            'public_key' => base64_encode(random_bytes(32)),
            'algorithm' => 'nacl_box_v1',
        ]);
        UserE2eeKey::query()->create([
            'user_id' => $recipient->id,
            'public_key' => base64_encode(random_bytes(32)),
            'algorithm' => 'nacl_box_v1',
        ]);

        Sanctum::actingAs($sender);

        $nonce = base64_encode(random_bytes(24));
        $cipher = base64_encode(random_bytes(48));

        $created = $this->postJson('/api/v1/messages', [
            'recipient_id' => $recipient->id,
            'e2ee' => [
                'v' => 1,
                'sender_public_key' => $senderKey->public_key,
                'ciphertext_sender' => $cipher,
                'nonce_sender' => $nonce,
                'ciphertext_recipient' => $cipher,
                'nonce_recipient' => $nonce,
            ],
        ]);

        $created->assertCreated();
        $created->assertJsonPath('message.body', null);
        $created->assertJsonPath('message.e2ee.v', 1);
        $created->assertJsonPath('message.e2ee.sender_public_key', $senderKey->public_key);

        $messageId = (int) $created->json('message.id');
        $message = Message::query()->findOrFail($messageId);

        $this->assertSame(1, $message->body_e2ee_version);
        $this->assertSame($senderKey->public_key, $message->body_e2ee_sender_public_key);
        $this->assertSame($cipher, $message->body_ciphertext_sender);
        $this->assertSame($nonce, $message->body_nonce_sender);
        $this->assertSame($cipher, $message->body_ciphertext_recipient);
        $this->assertSame($nonce, $message->body_nonce_recipient);
    }
}

