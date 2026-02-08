<?php

namespace Tests\Feature;

use App\Models\CircleMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CircleTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_circle_and_add_member(): void
    {
        $owner = User::factory()->create();
        $member = User::factory()->create();
        $newMember = User::factory()->create();

        Sanctum::actingAs($owner);

        $create = $this->postJson('/api/v1/circles', [
            'name' => 'Test Circle',
            'member_ids' => [$member->id],
        ]);

        $create->assertCreated();

        $circleId = $create->json('circle.id');

        $this->assertDatabaseHas('circle_members', [
            'circle_id' => $circleId,
            'user_id' => $owner->id,
            'role' => 'owner',
        ]);

        $this->assertDatabaseHas('circle_members', [
            'circle_id' => $circleId,
            'user_id' => $member->id,
        ]);

        $addMember = $this->postJson('/api/v1/circles/'.$circleId.'/members', [
            'user_id' => $newMember->id,
        ]);

        $addMember->assertCreated();

        $this->assertTrue(CircleMember::query()
            ->where('circle_id', $circleId)
            ->where('user_id', $newMember->id)
            ->exists());
    }
}
