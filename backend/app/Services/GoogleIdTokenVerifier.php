<?php

namespace App\Services;

use Google\Client as GoogleClient;

class GoogleIdTokenVerifier
{
    /**
     * @return array{success: bool, claims: array<string, mixed>|null, error_codes: list<string>}
     */
    public function verify(string $idToken): array
    {
        $idToken = trim($idToken);
        if ($idToken === '') {
            return ['success' => false, 'claims' => null, 'error_codes' => ['missing_id_token']];
        }

        $allowedClientIds = config('google.client_ids', []);
        if (! is_array($allowedClientIds)) {
            $allowedClientIds = [];
        }

        $client = new GoogleClient();

        try {
            $claims = $client->verifyIdToken($idToken);
        } catch (\Throwable $e) {
            return ['success' => false, 'claims' => null, 'error_codes' => ['verify_exception']];
        }

        if ($claims === false || ! is_array($claims)) {
            return ['success' => false, 'claims' => null, 'error_codes' => ['invalid_id_token']];
        }

        if ($allowedClientIds !== []) {
            $aud = $claims['aud'] ?? null;
            if (! is_string($aud) || $aud === '' || ! in_array($aud, $allowedClientIds, true)) {
                return ['success' => false, 'claims' => null, 'error_codes' => ['audience_mismatch']];
            }
        }

        return ['success' => true, 'claims' => $claims, 'error_codes' => []];
    }
}

