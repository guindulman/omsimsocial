<?php

return [
    /*
     * Cloudflare Turnstile (anti-bot)
     *
     * Set both TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY to enable
     * verification for registration requests.
     */
    'site' => env('TURNSTILE_SITE_KEY'),
    'secret' => env('TURNSTILE_SECRET_KEY'),

    // Global enablement when both keys are configured.
    'required' => (bool) (env('TURNSTILE_SITE_KEY') && env('TURNSTILE_SECRET_KEY')),

    /*
     * Registration challenge mode:
     * - always: require anti-bot challenge for every signup
     * - adaptive: require only after repeated attempts (lower friction)
     * - off: disable anti-bot for signup
     */
    'register_mode' => env('TURNSTILE_REGISTER_MODE', 'adaptive'),

    // In adaptive mode, allow this many attempts before requiring a challenge.
    'register_grace_attempts' => (int) env('TURNSTILE_REGISTER_GRACE_ATTEMPTS', 2),

    // Sliding window for adaptive attempt counting.
    'register_window_seconds' => (int) env('TURNSTILE_REGISTER_WINDOW_SECONDS', 3600),

    'verify_url' => env('TURNSTILE_VERIFY_URL', 'https://challenges.cloudflare.com/turnstile/v0/siteverify'),
    'timeout' => (int) env('TURNSTILE_TIMEOUT', 3),
];
