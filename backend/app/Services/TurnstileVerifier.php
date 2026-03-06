<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;

class TurnstileVerifier
{
    public function isRegisterChallengeRequired(Request $request): bool
    {
        if (! (bool) config('turnstile.required')) {
            return false;
        }

        $mode = strtolower(trim((string) config('turnstile.register_mode', 'adaptive')));
        if ($mode === 'off') {
            return false;
        }

        if ($mode === 'always') {
            return true;
        }

        if ($mode !== 'adaptive') {
            return true;
        }

        $graceAttempts = max(0, (int) config('turnstile.register_grace_attempts', 2));
        if ($graceAttempts === 0) {
            return true;
        }

        try {
            return RateLimiter::tooManyAttempts($this->registerAttemptKey($request), $graceAttempts);
        } catch (\Throwable $e) {
            report($e);
            return false;
        }
    }

    public function trackRegisterAttempt(Request $request): void
    {
        if (! (bool) config('turnstile.required')) {
            return;
        }

        $windowSeconds = max(60, (int) config('turnstile.register_window_seconds', 3600));
        try {
            RateLimiter::hit($this->registerAttemptKey($request), $windowSeconds);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    public function clearRegisterAttempts(Request $request): void
    {
        try {
            RateLimiter::clear($this->registerAttemptKey($request));
        } catch (\Throwable $e) {
            report($e);
        }
    }

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

    private function registerAttemptKey(Request $request): string
    {
        $ip = $request->ip() ?: 'unknown';
        $userAgent = trim((string) $request->userAgent());
        $signature = substr(hash('sha256', $userAgent), 0, 16);

        return "turnstile:register:{$ip}:{$signature}";
    }
}
