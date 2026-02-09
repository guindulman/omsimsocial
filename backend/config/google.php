<?php

return [
    /*
     * Google Sign-In (ID token verification)
     *
     * Mobile clients obtain a Google ID token and exchange it for a Sanctum token
     * via POST /api/v1/auth/google.
     */
    'enabled' => (bool) env('GOOGLE_AUTH_ENABLED', false),

    /*
     * Comma-separated list of allowed OAuth client IDs (audiences).
     * Example: GOOGLE_CLIENT_IDS="xxx.apps.googleusercontent.com,yyy.apps.googleusercontent.com"
     */
    'client_ids' => array_values(array_filter(array_map(
        static fn ($v) => trim($v),
        explode(',', (string) env('GOOGLE_CLIENT_IDS', ''))
    ))),
];

