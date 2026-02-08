<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            $key = $request->user()?->id ?: $request->ip();

            return Limit::perMinute(120)->by($key);
        });

        RateLimiter::for('invites', function (Request $request) {
            $key = $request->user()?->id ?: $request->ip();

            return Limit::perDay(10)->by($key);
        });

        RateLimiter::for('reactions', function (Request $request) {
            $key = $request->user()?->id ?: $request->ip();

            return Limit::perMinute(30)->by($key);
        });

        RateLimiter::for('adoptions', function (Request $request) {
            $key = $request->user()?->id ?: $request->ip();

            return Limit::perMinute(10)->by($key);
        });
    }
}
