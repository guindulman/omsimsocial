<?php

namespace Database\Seeders;

use App\Models\Connection;
use App\Models\Profile;
use App\Models\Post;
use App\Models\PostMedia;
use App\Models\ProfileSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProductionUserSeeder extends Seeder
{
    private const EMAIL_DOMAIN = 'omsim.test';
    private const TARGET_USER_COUNT = 120;
    private const TARGET_POSTS_MIN = 4;
    private const TARGET_POSTS_MAX = 10;

    private const SEED_USERS = [
        ['name' => 'Ava Santos', 'city' => 'Manila'],
        ['name' => 'Liam Reyes', 'city' => 'Cebu'],
        ['name' => 'Mia Cruz', 'city' => 'Quezon City'],
        ['name' => 'Noah Tan', 'city' => 'Makati'],
        ['name' => 'Sofia Lim', 'city' => 'Pasig'],
        ['name' => 'Lucas Diaz', 'city' => 'Taguig'],
        ['name' => 'Chloe Park', 'city' => 'Davao'],
        ['name' => 'Ethan Kim', 'city' => 'Baguio'],
        ['name' => 'Isla Navarro', 'city' => 'Iloilo'],
        ['name' => 'Nathan Ortiz', 'city' => 'Bacolod'],
        ['name' => 'Grace Nguyen', 'city' => 'Cavite'],
        ['name' => 'Caleb Walker', 'city' => 'Laguna'],
        ['name' => 'Zoe Brooks', 'city' => 'Antipolo'],
        ['name' => 'Owen Clark', 'city' => 'Mandaluyong'],
    ];

    private const BIOS = [
        'Coffee, cameras, and quiet walks.',
        'Building small joys daily.',
        'Always down for food trips.',
        'Sketching ideas and sharing stories.',
        'Learning, unlearning, and laughing.',
        'Collecting sunsets and good playlists.',
        'Weekend runs and weeknight reads.',
        'Designing a life I love.',
        'Making time for friends and family.',
        'Here for real connections.',
    ];

    private const CITIES = [
        'Manila',
        'Quezon City',
        'Cebu',
        'Davao',
        'Baguio',
        'Iloilo',
        'Makati',
        'Pasig',
        'Taguig',
        'Bacolod',
        'Cavite',
        'Laguna',
        'Antipolo',
        'Mandaluyong',
    ];

    private array $knownUsernames = [];
    private array $knownPhones = [];

    public function run(): void
    {
        $seededUsers = User::query()
            ->where('email', 'like', '%@'.self::EMAIL_DOMAIN)
            ->get();

        $this->knownUsernames = array_fill_keys(
            User::query()->pluck('username')->all(),
            true
        );
        $this->knownPhones = array_fill_keys(
            User::query()->whereNotNull('phone')->pluck('phone')->all(),
            true
        );

        $password = Hash::make('password');
        $created = $seededUsers->all();

        foreach (self::SEED_USERS as $seed) {
            if ($this->userExists($seed['name'])) {
                continue;
            }

            $created[] = $this->createUser(
                name: $seed['name'],
                city: $seed['city'],
                password: $password
            );
        }

        while (count($created) < self::TARGET_USER_COUNT) {
            $created[] = $this->createUser(
                name: fake()->name(),
                city: fake()->randomElement(self::CITIES),
                password: $password
            );
        }

        $this->seedConnections($created);
        $this->seedPosts($created);
    }

    private function createUser(string $name, string $city, string $password): User
    {
        $username = $this->uniqueUsername($name);
        $user = User::query()->create([
            'name' => $name,
            'username' => $username,
            'email' => $username.'@'.self::EMAIL_DOMAIN,
            'phone' => $this->uniquePhone(),
            'password' => $password,
        ]);

        $showCity = fake()->boolean(80);
        $allowInvites = fake()->boolean(85);
        $avatarSeed = rawurlencode($username);

        Profile::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'avatar_url' => 'https://i.pravatar.cc/150?u='.$avatarSeed,
                'bio' => fake()->randomElement(self::BIOS),
                'city' => $city,
                'privacy_prefs' => [
                    'show_city' => $showCity,
                    'allow_invites' => $allowInvites,
                    'nearby_opt_in' => fake()->boolean(25),
                ],
            ]
        );

        ProfileSetting::query()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'profile_visibility' => fake()->boolean(30) ? 'public' : 'connections',
                'share_profile_views' => fake()->boolean(15),
                'show_city' => $showCity,
                'show_links' => fake()->boolean(70),
                'allow_invites_from' => $allowInvites ? 'everyone' : 'mutuals',
                'allow_calls_from' => fake()->randomElement(['connections', 'favorites', 'nobody']),
            ]
        );

        return $user;
    }

    private function userExists(string $name): bool
    {
        return User::query()
            ->where('email', 'like', '%@'.self::EMAIL_DOMAIN)
            ->where('name', $name)
            ->exists();
    }

    private function uniqueUsername(string $name): string
    {
        $base = Str::slug($name, '');
        $base = Str::lower(preg_replace('/[^a-z0-9]/', '', $base ?? '') ?? '');
        $base = $base === '' ? 'user' : $base;
        $base = substr($base, 0, 14);

        $candidate = $base;
        $suffix = 1;

        while (isset($this->knownUsernames[$candidate])) {
            $candidate = $base.$suffix;
            $suffix++;
        }

        $this->knownUsernames[$candidate] = true;

        return $candidate;
    }

    private function uniquePhone(): ?string
    {
        if (! fake()->boolean(30)) {
            return null;
        }

        for ($attempts = 0; $attempts < 10; $attempts++) {
            $phone = '+639'.str_pad((string) random_int(0, 999999999), 9, '0', STR_PAD_LEFT);

            if (isset($this->knownPhones[$phone])) {
                continue;
            }

            $this->knownPhones[$phone] = true;

            return $phone;
        }

        return null;
    }

    private function seedConnections(array $users): void
    {
        if (count($users) < 2) {
            return;
        }

        $types = ['friend', 'family', 'work', 'community'];
        $levels = ['acquaintance', 'friend', 'inner'];
        $pairs = [];

        foreach ($users as $user) {
            $targets = collect($users)
                ->where('id', '!=', $user->id)
                ->shuffle()
                ->take(random_int(2, 5));

            foreach ($targets as $other) {
                $first = min($user->id, $other->id);
                $second = max($user->id, $other->id);
                $pairKey = $first.'-'.$second;

                if (isset($pairs[$pairKey])) {
                    continue;
                }

                $pairs[$pairKey] = true;

                Connection::query()->firstOrCreate(
                    [
                        'requester_id' => $first,
                        'addressee_id' => $second,
                    ],
                    [
                        'status' => 'accepted',
                        'method' => 'invite',
                        'type' => $types[array_rand($types)],
                        'level' => $levels[array_rand($levels)],
                    ]
                );
            }
        }
    }

    private function seedPosts(array $users): void
    {
        $statusPool = ['vip', 'vip', 'public', 'public', 'gem'];
        $scopes = ['public', 'connections', 'nearby', 'event', 'public', 'connections'];
        $captions = [
            'Quick check-in with my circle.',
            'Found a new spot today. Worth a visit.',
            'Small wins count too.',
            'Weekend mood.',
            'Trying something new and loving it.',
            'Late-night thoughts.',
            'Catching up with people who matter.',
            'Snapshot from today.',
            'Quiet moments are underrated.',
            'Sharing a little joy.',
            'Staying curious.',
            'Letting the day breathe.',
        ];

        foreach ($users as $user) {
            $existingCount = Post::query()->where('user_id', $user->id)->count();
            $target = random_int(self::TARGET_POSTS_MIN, self::TARGET_POSTS_MAX);

            if ($existingCount >= $target) {
                continue;
            }

            $toCreate = $target - $existingCount;

            for ($i = 0; $i < $toCreate; $i++) {
                $status = $statusPool[array_rand($statusPool)];
                $expiresAt = Carbon::now()->addHours(random_int(6, 48));

                $post = Post::query()->create([
                    'user_id' => $user->id,
                    'caption' => $captions[array_rand($captions)],
                    'status' => $status,
                    'visibility_scope' => $scopes[array_rand($scopes)],
                    'vip_until' => $status === 'vip'
                        ? Carbon::now()->addHours(random_int(1, 6))
                        : null,
                    'expires_at' => $expiresAt,
                    'adopted_count' => random_int(0, 4),
                    'clarify_count' => random_int(0, 3),
                ]);

                $mediaCount = random_int(1, 3);
                for ($m = 0; $m < $mediaCount; $m++) {
                    $seed = $post->id.'-'.$m;
                    PostMedia::query()->create([
                        'post_id' => $post->id,
                        'type' => 'image',
                        'url' => 'https://picsum.photos/seed/'.$seed.'/900/900',
                        'thumb_url' => 'https://picsum.photos/seed/'.$seed.'/400/400',
                        'duration_ms' => null,
                        'order_index' => $m,
                    ]);
                }
            }
        }
    }
}
