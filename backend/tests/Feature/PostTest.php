<?php

namespace Tests\Feature;

use App\Models\Circle;
use App\Models\CircleMember;
use App\Models\InboxEvent;
use App\Models\Memory;
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

    public function test_tagging_user_creates_single_inbox_activity_event(): void
    {
        $author = User::factory()->create();
        $tagged = User::factory()->create();

        Sanctum::actingAs($author);

        $response = $this->postJson('/api/v1/memories', [
            'scope' => 'public',
            'body' => 'Tagging a friend in this post.',
            'tags' => [$tagged->id, $tagged->id, $author->id],
        ]);

        $response->assertCreated();
        $memoryId = (int) $response->json('memory.id');

        $tagEvents = InboxEvent::query()
            ->where('user_id', $tagged->id)
            ->where('type', 'memory_tagged')
            ->get();

        $this->assertCount(1, $tagEvents);
        $this->assertSame($memoryId, data_get($tagEvents->first()?->data, 'memory_id'));
        $this->assertSame($author->id, data_get($tagEvents->first()?->data, 'actor_id'));

        $authorEvents = InboxEvent::query()
            ->where('user_id', $author->id)
            ->where('type', 'memory_tagged')
            ->count();

        $this->assertSame(0, $authorEvents);
    }

    public function test_user_can_reshare_own_post(): void
    {
        $author = User::factory()->create();
        Sanctum::actingAs($author);

        $memory = Memory::query()->create([
            'author_id' => $author->id,
            'scope' => 'public',
            'body' => 'My post',
            'comments_count_cached' => 0,
            'hearts_count_cached' => 0,
            'saves_count_cached' => 0,
            'reshares_count_cached' => 0,
        ]);

        $response = $this->postJson("/api/v1/memories/{$memory->id}/reshare");
        $response->assertCreated();

        $this->assertDatabaseHas('memory_reshares', [
            'memory_id' => $memory->id,
            'user_id' => $author->id,
        ]);

        $this->assertSame(1, (int) $memory->fresh()->reshares_count_cached);
    }

    public function test_cannot_reshare_deleted_post(): void
    {
        $author = User::factory()->create();
        Sanctum::actingAs($author);

        $memory = Memory::query()->create([
            'author_id' => $author->id,
            'scope' => 'public',
            'body' => 'Will be deleted',
            'comments_count_cached' => 0,
            'hearts_count_cached' => 0,
            'saves_count_cached' => 0,
            'reshares_count_cached' => 0,
        ]);

        $memory->delete();

        $response = $this->postJson("/api/v1/memories/{$memory->id}/reshare");
        $response->assertNotFound();
    }
}
