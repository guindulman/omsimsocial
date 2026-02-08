<?php

namespace App\Providers;

use App\Models\Circle;
use App\Models\Memory;
use App\Policies\CirclePolicy;
use App\Policies\MemoryPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Memory::class => MemoryPolicy::class,
        Circle::class => CirclePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
