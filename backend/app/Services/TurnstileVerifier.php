<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class TurnstileVerifier
{
    /**
     * Verify a Turnstile token against Cloudflare.
     *
     * @return array{success: bool, error_codes: list<string>}
     */
    public function verify(string $token, ?string $ip = null): array
    {
        $secret = (string) config('turnstile.secret');
        $url = (string) config('turnstile.verify_url');
        $timeout = (int) config('turnstile.timeout', 3);

        if ($secret === '' || $token === '') {
            return ['success' => false, 'error_codes' => ['missing_secret_or_token']];
        }

        try {
            $response = Http::asForm()
                ->timeout($timeout)
                ->post($url, array_filter([
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $ip,
                ], fn ($v) => $v !== null && $v !== ''));
        } catch (\Throwable $e) {
            return ['success' => false, 'error_codes' => ['turnstile_request_failed']];
        }

        if (! $response->ok()) {
            return ['success' => false, 'error_codes' => ['turnstile_http_error']];
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            return ['success' => false, 'error_codes' => ['turnstile_bad_response']];
        }

        $errorCodesRaw = $payload['error-codes'] ?? [];
        $errorCodes = [];
        if (is_array($errorCodesRaw)) {
            foreach ($errorCodesRaw as $code) {
                if (is_string($code) && $code !== '') {
                    $errorCodes[] = $code;
                }
            }
        }

        return [
            'success' => (bool) ($payload['success'] ?? false),
            'error_codes' => $errorCodes,
        ];
    }
}

