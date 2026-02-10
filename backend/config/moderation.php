<?php

return [
    // When enabled, user-uploaded images can be blocked based on provider results.
    'enabled' => (bool) env('MODERATION_ENABLED', false),

    // Currently supported: google_vision
    'provider' => env('MODERATION_PROVIDER', 'google_vision'),

    // Google Cloud Vision SafeSearch detection
    // Create an API key with the Vision API enabled.
    'google_vision_api_key' => env('MODERATION_GOOGLE_VISION_API_KEY'),

    // Fail closed if moderation is enabled but the provider is missing credentials.
    'fail_closed' => (bool) env('MODERATION_FAIL_CLOSED', true),

    // For Google SafeSearch likelihood values:
    // UNKNOWN, VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
    'block_threshold' => env('MODERATION_BLOCK_THRESHOLD', 'LIKELY'),

    // Request timeout (seconds) for provider calls.
    'timeout' => (int) env('MODERATION_TIMEOUT', 3),

    // Max bytes to send to the provider when moderation is enabled (base64 expands size).
    // Defaults to 10 MiB.
    'max_image_bytes' => (int) env('MODERATION_MAX_IMAGE_BYTES', 10 * 1024 * 1024),
];

