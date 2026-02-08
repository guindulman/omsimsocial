<?php

namespace Tests\Feature;

use App\Models\Circle;
use App\Models\CircleMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PostTest extends TestCase
{
    use RefreshDatabase;

    public function test_circle_memory_visibility(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $outsider = User::factory()->create();

        $circle = Circle::query()->create([
            'owner_id' => $owner->id,
            'name' => 'Shared Circle',
            'invite_only' => true,
            'prompt_frequency' => 'off',
        ]);

        CircleMember::query()->create([
            'circle_id' => $circle->id,
            'user_id' => $owner->id,
            'role' => 'owner',
        ]);

        CircleMember::query()->create([
            'circle_id' => $circle->id,
            'user_id' => $member->id,
            'role' => 'member',
        ]);

        Sanctum::actingAs($owner);

        $create = $this->postJson('/api/v1/memories', [
            'scope' => 'circle',
            'circle_id' => $circle->id,
            'body' => 'Circle memory',
        ]);

        $create->assertCreated();
        $memoryId = $create->json('memory.id');

        Sanctum::actingAs($member);
        $memberView = $this->getJson('/api/v1/memories/'.$memoryId);
        $memberView->assertOk();

        Sanctum::actingAs($outsider);
        $outsiderView = $this->getJson('/api/v1/memories/'.$memoryId);
        $outsiderView->assertForbidden();
    }
}
