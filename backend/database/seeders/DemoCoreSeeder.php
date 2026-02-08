<?php

namespace Database\Seeders;

use App\Models\Adoption;
use App\Models\Circle;
use App\Models\CircleMember;
use App\Models\Connection;
use App\Models\InboxEvent;
use App\Models\Memory;
use App\Models\Profile;
use App\Models\User;
use App\Models\VaultItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoCoreSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Ari Lane',
                'username' => 'ari',
                'email' => 'ari@example.com',
                'city' => 'Manila',
            ],
            [
                'name' => 'Bea Cruz',
                'username' => 'bea',
                'email' => 'bea@example.com',
                'city' => 'Cebu',
            ],
        ];

        $created = [];

        foreach ($users as $payload) {
            $user = User::query()->create([
                'name' => $payload['name'],
                'username' => $payload['username'],
                'email' => $payload['email'],
                'password' => Hash::make('password'),
            ]);

            Profile::query()->create([
                'user_id' => $user->id,
                'avatar_url' => null,
                'bio' => 'Demo profile for '.$payload['name'],
                'city' => $payload['city'],
                'privacy_prefs' => [
                    'show_city' => true,
                    'allow_invites' => true,
                ],
            ]);

            $created[] = $user;
        }

        [$owner, $member] = $created;

        Connection::query()->create([
            'requester_id' => $owner->id,
            'addressee_id' => $member->id,
            'status' => 'accepted',
            'method' => 'invite',
            'type' => 'friend',
            'level' => 'friend',
        ]);

        $circle = Circle::query()->create([
            'owner_id' => $owner->id,
            'name' => 'Omsim First Circle',
            'icon' => 'spark',
            'invite_only' => true,
            'prompt_frequency' => 'weekly',
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

        $memory = Memory::query()->create([
            'author_id' => $owner->id,
            'scope' => 'circle',
            'circle_id' => $circle->id,
            'body' => 'First memory in our circle. Welcome!',
        ]);

        $secondMemory = Memory::query()->create([
            'author_id' => $owner->id,
            'scope' => 'circle',
            'circle_id' => $circle->id,
            'body' => 'Another memory to revisit later.',
        ]);

        $adoption = Adoption::query()->create([
            'memory_id' => $memory->id,
            'user_id' => $member->id,
            'note' => 'Saving this to revisit later.',
            'visibility' => 'shared',
        ]);

        VaultItem::query()->create([
            'user_id' => $member->id,
            'memory_id' => $memory->id,
            'source' => 'adoption',
        ]);

        InboxEvent::query()->create([
            'user_id' => $owner->id,
            'type' => 'adoption_note',
            'data' => [
                'memory_id' => $memory->id,
                'adoption_id' => $adoption->id,
                'adopter_id' => $member->id,
                'note' => $adoption->note,
            ],
        ]);

        $secondAdoption = Adoption::query()->create([
            'memory_id' => $secondMemory->id,
            'user_id' => $member->id,
            'note' => 'Adding this to my vault.',
            'visibility' => 'private',
        ]);

        VaultItem::query()->create([
            'user_id' => $member->id,
            'memory_id' => $secondMemory->id,
            'source' => 'adoption',
        ]);

        InboxEvent::query()->create([
            'user_id' => $owner->id,
            'type' => 'adoption_note',
            'data' => [
                'memory_id' => $secondMemory->id,
                'adoption_id' => $secondAdoption->id,
                'adopter_id' => $member->id,
                'note' => $secondAdoption->note,
            ],
        ]);
    }
}
