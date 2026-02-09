<?php

return [
    // End-to-end encryption for direct message bodies.
    // When enabled, clients send ciphertext and the server stores it without decryption.
    'enabled' => env('E2EE_ENABLED', false),

    // If true, plaintext DM bodies are rejected (requires clients to support E2EE).
    'required' => env('E2EE_REQUIRED', false),
];

