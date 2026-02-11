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

        RateLimiter::for('register', function (Request $request) {
            $ip = $request->ip() ?: 'unknown';
            $email = strtolower(trim((string) $request->input('email', '')));
            $emailKey = $email !== '' ? "email:{$email}" : 'email:missing';

            // Register endpoints are frequent bot targets. Limit by both IP and identifier.
            return [
                Limit::perMinute(5)->by("ip:{$ip}"),
                Limit::perMinute(3)->by($emailKey),
                Limit::perHour(20)->by("ip:{$ip}"),
            ];
        });

        RateLimiter::for('login', function (Request $request) {
            $ip = $request->ip() ?: 'unknown';
            $identifier = strtolower(trim((string) $request->input('identifier', '')));
            $identifierKey = $identifier !== '' ? "identifier:{$identifier}" : 'identifier:missing';

            return [
                Limit::perMinute(10)->by("ip:{$ip}"),
                Limit::perMinute(10)->by($identifierKey),
                Limit::perHour(120)->by("ip:{$ip}"),
            ];
        });

        RateLimiter::for('admin-login', function (Request $request) {
            $ip = $request->ip() ?: 'unknown';
            $email = strtolower(trim((string) $request->input('email', '')));
            $emailKey = $email !== '' ? "email:{$email}" : 'email:missing';

            return [
                Limit::perMinute(5)->by("ip:{$ip}"),
                Limit::perMinute(5)->by($emailKey),
                Limit::perHour(30)->by("ip:{$ip}"),
            ];
        });

        RateLimiter::for('contact', function (Request $request) {
            $ip = $request->ip() ?: 'unknown';
            $email = strtolower(trim((string) $request->input('email', '')));
            $emailKey = $email !== '' ? "email:{$email}" : 'email:missing';

            return [
                Limit::perMinute(3)->by("ip:{$ip}"),
                Limit::perHour(12)->by("ip:{$ip}"),
                Limit::perHour(6)->by($emailKey),
            ];
        });

        RateLimiter::for('data-deletion', function (Request $request) {
            $ip = $request->ip() ?: 'unknown';
            $email = strtolower(trim((string) $request->input('email', '')));
            $username = strtolower(trim((string) $request->input('username', '')));
            $identifier = $email !== '' ? "email:{$email}" : ($username !== '' ? "username:{$username}" : 'identifier:missing');

            return [
                Limit::perMinute(3)->by("ip:{$ip}"),
                Limit::perHour(10)->by("ip:{$ip}"),
                Limit::perHour(4)->by($identifier),
            ];
        });

        RateLimiter::for('invites', function (Request $request) {
            $key = $request->user()?->id ?: $request->ip();

            return Limit::perDay(10)->by($key);
        });

        RateLimiter::for('posts', function (Request $request) {
            $key = $request->user()?->id ?: $request->ip();

            // Prevent rapid-fire posting bursts from newly created or scripted accounts.
            return [
                Limit::perMinute(10)->by($key),
                Limit::perHour(200)->by($key),
            ];
        });

        RateLimiter::for('messages', function (Request $request) {
            $key = $request->user()?->id ?: $request->ip();

            return [
                Limit::perMinute(20)->by($key),
                Limit::perHour(500)->by($key),
            ];
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
