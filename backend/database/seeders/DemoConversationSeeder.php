<?php

namespace Database\Seeders;

use App\Models\Connection;
use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoConversationSeeder extends Seeder
{
    public function run(): void
    {
        $userA = User::query()->first();
        $userB = User::query()->skip(1)->first();

        if (! $userA || ! $userB) {
            return;
        }

        [$first, $second] = $userA->id < $userB->id
            ? [$userA->id, $userB->id]
            : [$userB->id, $userA->id];

        Connection::query()->firstOrCreate(
            ['user_a_id' => $first, 'user_b_id' => $second],
            ['method' => 'invite']
        );

        $conversation = Conversation::query()->create([
            'type' => 'direct',
        ]);

        ConversationParticipant::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $userA->id,
        ]);

        ConversationParticipant::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $userB->id,
        ]);

        Message::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $userA->id,
            'message' => 'Welcome to Omsim chat.',
        ]);

        Message::query()->create([
            'conversation_id' => $conversation->id,
            'user_id' => $userB->id,
            'message' => 'Glad to be here!',
        ]);
    }
}
