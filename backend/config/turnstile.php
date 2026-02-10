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

    // Require Turnstile when both keys are configured.
    'required' => (bool) (env('TURNSTILE_SITE_KEY') && env('TURNSTILE_SECRET_KEY')),

    'verify_url' => env('TURNSTILE_VERIFY_URL', 'https://challenges.cloudflare.com/turnstile/v0/siteverify'),
    'timeout' => (int) env('TURNSTILE_TIMEOUT', 3),
];

