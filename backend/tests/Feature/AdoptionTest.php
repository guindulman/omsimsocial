<?php

namespace Tests\Feature;

use App\Models\Circle;
use App\Models\CircleMember;
use App\Models\InboxEvent;
use App\Models\User;
use App\Models\VaultItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdoptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_adopt_memory_creates_vault_item_and_inbox_event(): void
    {
        $author = User::factory()->create();
        $adopter = User::factory()->create();

        $circle = Circle::query()->create([
            'owner_id' => $author->id,
            'name' => 'Adoption Circle',
            'invite_only' => true,
            'prompt_frequency' => 'off',
        ]);

        CircleMember::query()->create([
            'circle_id' => $circle->id,
            'user_id' => $author->id,
            'role' => 'owner',
        ]);

        CircleMember::query()->create([
            'circle_id' => $circle->id,
            'user_id' => $adopter->id,
            'role' => 'member',
        ]);

        Sanctum::actingAs($author);
        $memoryResponse = $this->postJson('/api/v1/memories', [
            'scope' => 'circle',
            'circle_id' => $circle->id,
            'body' => 'Memory to adopt',
        ]);

        $memoryResponse->assertCreated();
        $memoryId = $memoryResponse->json('memory.id');

        Sanctum::actingAs($adopter);
        $adopt = $this->postJson('/api/v1/memories/'.$memoryId.'/adopt', [
            'note' => 'Saving this for later',
            'visibility' => 'shared',
        ]);

        $adopt->assertCreated();

        $this->assertDatabaseHas('vault_items', [
            'user_id' => $adopter->id,
            'memory_id' => $memoryId,
            'source' => 'adoption',
        ]);

        $this->assertTrue(InboxEvent::query()
            ->where('user_id', $author->id)
            ->where('type', 'adoption_note')
            ->exists());
    }
}
