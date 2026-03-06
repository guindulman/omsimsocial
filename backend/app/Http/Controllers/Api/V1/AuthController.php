<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\OAuthIdentity;
use App\Models\Profile;
use App\Models\User;
use App\Services\GoogleIdTokenVerifier;
use App\Services\TurnstileVerifier;
use Illuminate\Auth\Events\Verified;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, TurnstileVerifier $turnstile)
    {
        try {
            $challengeRequired = $turnstile->isRegisterChallengeRequired($request);
            $turnstile->trackRegisterAttempt($request);

            if ($challengeRequired) {
                $token = trim((string) $request->input('turnstile_token', ''));
                if ($token === '') {
                    return response()->json([
                        'code' => 'captcha_required',
                        'message' => 'Please complete the anti-bot check.',
                    ], 422);
                }

                $result = $turnstile->verify($token, $request->ip());
                if (! $result['success']) {
                    return response()->json([
                        'code' => 'captcha_failed',
                        'message' => 'Anti-bot verification failed. Please try again.',
                        'error_codes' => $result['error_codes'],
                    ], 422);
                }

                // User solved the challenge successfully; reset adaptive counter.
                $turnstile->clearRegisterAttempts($request);
            }

            $payload = $request->validated();

            /** @var User $user */
            $user = DB::transaction(function () use ($payload): User {
                $createdUser = User::query()->create([
                    'name' => $payload['name'],
                    'username' => $payload['username'],
                    'email' => $payload['email'],
                    'phone' => $payload['phone'] ?? null,
                    'password' => Hash::make($payload['password']),
                ]);

                Profile::query()->create([
                    'user_id' => $createdUser->id,
                    'privacy_prefs' => [
                        'show_city' => true,
                        'allow_invites' => true,
                    ],
                ]);

                return $createdUser;
            });

            $verificationEmailSent = false;
            try {
                $user->sendEmailVerificationNotification();
                $verificationEmailSent = true;
            } catch (\Throwable $e) {
                report($e);
            }

            $rememberMe = (bool) $request->boolean('remember_me', true);
            $tokens = $this->issueAuthTokens($user, $rememberMe);

            return response()->json([
                'user' => UserResource::make($user->load('profile')),
                ...$tokens,
                'remember_me' => $rememberMe,
                'email_verification' => [
                    'required' => true,
                    'verified' => false,
                    'sent' => $verificationEmailSent,
                ],
            ], 201);
        } catch (QueryException $e) {
            report($e);
            $sqlState = (string) $e->getCode();

            if (in_array($sqlState, ['23000', '23505'], true)) {
                return response()->json([
                    'code' => 'validation_failed',
                    'message' => 'Account details are already in use.',
                ], 422);
            }

            return response()->json([
                'code' => 'register_failed',
                'message' => 'Unable to create account right now.',
            ], 500);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'code' => 'register_failed',
                'message' => 'Unable to create account right now.',
            ], 500);
        }
    }

    public function antiBot(Request $request, TurnstileVerifier $turnstile)
    {
        return response()->json([
            'turnstile' => [
                'required' => $turnstile->isRegisterChallengeRequired($request),
                'path' => '/auth/turnstile',
            ],
        ]);
    }

    public function verifyEmail(Request $request, int $id, string $hash)
    {
        $user = User::query()->find($id);
        if (! $user) {
            return response('Invalid verification link.', 404);
        }

        if (! hash_equals((string) $hash, sha1((string) $user->getEmailForVerification()))) {
            return response('Invalid verification link.', 403);
        }

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
            event(new Verified($user));
        }

        $mobileScheme = trim((string) config('app.mobile_scheme', 'omsimsocial'));
        $openAppUrl = ($mobileScheme !== '' ? $mobileScheme : 'omsimsocial').'://login?email_verified=1';
        $openAppUrlEscaped = htmlspecialchars($openAppUrl, ENT_QUOTES, 'UTF-8');

        $html = <<<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Email verified</title>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        background: #0b1220;
        color: #e5e7eb;
      }
      .wrap {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .card {
        max-width: 480px;
        width: 100%;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        background: rgba(17, 24, 39, 0.92);
        padding: 20px;
      }
      h1 {
        margin: 0 0 10px;
        font-size: 22px;
      }
      p {
        margin: 0;
        line-height: 1.5;
      }
      .actions {
        margin-top: 14px;
      }
      .btn {
        display: inline-block;
        text-decoration: none;
        background: #2563eb;
        color: #ffffff;
        border-radius: 8px;
        padding: 10px 14px;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>Email verified</h1>
        <p>Your email is verified. You can return to the app and start posting or messaging.</p>
        <div class="actions">
          <a class="btn" href="{$openAppUrlEscaped}">Open OmsimSocial app</a>
        </div>
      </div>
    </div>
  </body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=utf-8');
    }

    public function resendEmailVerification(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'code' => 'unauthenticated',
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'code' => 'email_already_verified',
                'message' => 'Email is already verified.',
            ], 409);
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'code' => 'verification_send_failed',
                'message' => 'Unable to send verification email right now.',
            ], 500);
        }

        return response()->json([
            'code' => 'verification_sent',
            'message' => 'Verification email sent.',
        ]);
    }

    public function turnstile(Request $request, TurnstileVerifier $turnstile)
    {
        $siteKey = trim((string) config('turnstile.site'));
        $required = $turnstile->isRegisterChallengeRequired($request);
        $redirectUri = $this->resolveTurnstileRedirectUri($request->query('redirect_uri'));
        $redirectUriJson = $redirectUri ? json_encode($redirectUri, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT) : 'null';

        if ($siteKey === '') {
            $html = <<<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Anti-bot check</title>
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        background: transparent;
        color: #111827;
      }
      .wrap {
        padding: 12px;
      }
      .card {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px;
        background: #ffffff;
      }
      .hint {
        font-size: 12px;
        color: #6b7280;
      }
    </style>
    <script>
      (function () {
        const redirectUri = {$redirectUriJson};

        function post(obj) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(obj));
          }
        }

        function redirectWithError(code) {
          if (!redirectUri) {
            return;
          }
          const separator = redirectUri.indexOf("?") === -1 ? "?" : "&";
          window.location.replace(redirectUri + separator + "turnstile_error=" + encodeURIComponent(code));
        }

        post({ type: "turnstile_status", required: false, configured: false });
        redirectWithError("not_configured");
      })();
    </script>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div><strong>Anti-bot check not configured</strong></div>
        <div class="hint">Set TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY on the server to enable.</div>
      </div>
    </div>
  </body>
</html>
HTML;

            return response($html, 200)->header('Content-Type', 'text/html; charset=utf-8');
        }

        $siteKeyEscaped = htmlspecialchars($siteKey, ENT_QUOTES, 'UTF-8');
        $requiredJson = $required ? 'true' : 'false';

        $html = <<<HTML
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Anti-bot check</title>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad" async defer></script>
    <style>
      html,
      body {
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        background: transparent;
      }
      .wrap {
        padding: 12px;
      }
      .card {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 12px;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 92px;
      }
    </style>
    <script>
      function post(obj) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(obj));
        }
      }

      const redirectUri = {$redirectUriJson};

      function redirectWithToken(token) {
        if (!redirectUri) {
          return;
        }
        const separator = redirectUri.indexOf("?") === -1 ? "?" : "&";
        window.location.replace(redirectUri + separator + "turnstile_token=" + encodeURIComponent(token));
      }

      function redirectWithError(code) {
        if (!redirectUri) {
          return;
        }
        const separator = redirectUri.indexOf("?") === -1 ? "?" : "&";
        window.location.replace(redirectUri + separator + "turnstile_error=" + encodeURIComponent(code));
      }

      function onTurnstileLoad() {
        post({ type: "turnstile_status", required: {$requiredJson}, configured: true });
        try {
          turnstile.render("#turnstile", {
            sitekey: "{$siteKeyEscaped}",
            callback: function (token) {
              post({ type: "turnstile_token", token: token });
              redirectWithToken(token);
            },
            "expired-callback": function () {
              post({ type: "turnstile_expired" });
              redirectWithError("expired");
            },
            "error-callback": function (code) {
              const normalized = typeof code === "string" && code !== "" ? code : "widget_error";
              post({ type: "turnstile_error", code: normalized });
              redirectWithError(normalized);
            },
          });
        } catch (e) {
          post({ type: "turnstile_error", code: "render_exception" });
          redirectWithError("render_exception");
        }
      }
    </script>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div id="turnstile"></div>
      </div>
    </div>
  </body>
</html>
HTML;

        return response($html, 200)->header('Content-Type', 'text/html; charset=utf-8');
    }

    private function resolveTurnstileRedirectUri(mixed $redirectUri): ?string
    {
        if (! is_string($redirectUri)) {
            return null;
        }

        $candidate = trim($redirectUri);
        if ($candidate === '') {
            return null;
        }

        $parts = parse_url($candidate);
        if (! is_array($parts)) {
            return null;
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        if (! in_array($scheme, ['omsimsocial', 'exp'], true)) {
            return null;
        }

        return $candidate;
    }

    public function google(Request $request, GoogleIdTokenVerifier $google)
    {
        if (! (bool) config('google.enabled')) {
            return response()->json([
                'code' => 'google_disabled',
                'message' => 'Google login is not enabled.',
            ], 501);
        }

        $clientIds = config('google.client_ids', []);
        if (! is_array($clientIds) || $clientIds === []) {
            return response()->json([
                'code' => 'google_not_configured',
                'message' => 'Google login is not configured.',
            ], 501);
        }

        $payload = $request->validate([
            'id_token' => ['required', 'string'],
        ]);

        $result = $google->verify((string) $payload['id_token']);
        if (! $result['success'] || ! is_array($result['claims'])) {
            return response()->json([
                'code' => 'invalid_google_token',
                'message' => 'Google authentication failed.',
            ], 401);
        }

        $claims = $result['claims'];
        $sub = $claims['sub'] ?? null;
        $email = $claims['email'] ?? null;
        $name = $claims['name'] ?? null;
        $picture = $claims['picture'] ?? null;
        $emailVerified = (bool) ($claims['email_verified'] ?? false);

        if (! is_string($sub) || trim($sub) === '') {
            return response()->json([
                'code' => 'invalid_google_token',
                'message' => 'Google authentication failed.',
            ], 401);
        }

        if (! is_string($email) || trim($email) === '') {
            // ID tokens should include an email for most apps. Reject to avoid accounts with no identifier.
            return response()->json([
                'code' => 'google_email_required',
                'message' => 'A Google account email is required.',
            ], 422);
        }

        $email = strtolower(trim($email));
        $name = is_string($name) && trim($name) !== '' ? trim($name) : 'Google User';

        $user = DB::transaction(function () use ($sub, $email, $name, $picture, $emailVerified) {
            $identity = OAuthIdentity::query()
                ->where('provider', 'google')
                ->where('provider_user_id', $sub)
                ->with('user.profile')
                ->first();

            if ($identity?->user) {
                return $identity->user;
            }

            $user = User::query()->where('email', $email)->with('profile')->first();

            if (! $user) {
                $username = $this->generateUniqueUsername($email);

                $user = User::query()->create([
                    'name' => $name,
                    'username' => $username,
                    'email' => $email,
                    'password' => Hash::make(Str::random(48)),
                ]);

                if ($emailVerified) {
                    $user->email_verified_at = now();
                    $user->save();
                }

                Profile::query()->create([
                    'user_id' => $user->id,
                    'avatar_url' => is_string($picture) ? $picture : null,
                    'privacy_prefs' => [
                        'show_city' => true,
                        'allow_invites' => true,
                    ],
                ]);

                $user->load('profile');
            }

            OAuthIdentity::query()->firstOrCreate(
                ['provider' => 'google', 'provider_user_id' => $sub],
                ['user_id' => $user->id, 'email' => $email]
            );

            return $user;
        });

        if (! $user->is_active) {
            return response()->json([
                'code' => 'account_inactive',
                'message' => 'Account is inactive.',
            ], 403);
        }

        $rememberMe = (bool) $request->boolean('remember_me', true);
        $tokens = $this->issueAuthTokens($user, $rememberMe);

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
            ...$tokens,
            'remember_me' => $rememberMe,
        ]);
    }

    private function generateUniqueUsername(string $email): string
    {
        $local = explode('@', $email, 2)[0] ?? 'user';
        $base = strtolower($local);
        $base = preg_replace('/[^a-z0-9_]+/', '', $base) ?? 'user';
        $base = trim($base, '_');
        if (strlen($base) < 2) {
            $base = 'user';
        }

        $base = substr($base, 0, 24);
        $candidate = $base;
        $suffix = 0;

        while (User::query()->where('username', $candidate)->exists()) {
            $suffix++;
            $candidate = substr($base, 0, 24 - strlen((string) $suffix)).$suffix;
        }

        return $candidate;
    }

    public function login(LoginRequest $request)
    {
        $identifier = $request->input('identifier');

        $user = User::query()
            ->where('email', $identifier)
            ->orWhere('username', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (! $user || ! Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'code' => 'invalid_credentials',
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'code' => 'account_inactive',
                'message' => 'Account is inactive.',
            ], 403);
        }

        $rememberMe = (bool) $request->boolean('remember_me', true);
        $tokens = $this->issueAuthTokens($user, $rememberMe);

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
            ...$tokens,
            'remember_me' => $rememberMe,
        ]);
    }

    public function logout(Request $request)
    {
        $payload = $request->validate([
            'refresh_token' => ['nullable', 'string'],
        ]);

        $request->user()?->currentAccessToken()?->delete();

        $refreshToken = $payload['refresh_token'] ?? null;
        if (is_string($refreshToken) && trim($refreshToken) !== '') {
            $tokenModel = PersonalAccessToken::findToken($refreshToken);
            if (
                $tokenModel
                && $tokenModel->tokenable_id === $request->user()?->id
                && $tokenModel->tokenable_type === User::class
                && $tokenModel->can('refresh')
            ) {
                $tokenModel->delete();
            }
        }

        return response()->json(['message' => 'Logged out.']);
    }

    public function refresh(Request $request)
    {
        $payload = $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $tokenModel = PersonalAccessToken::findToken($payload['refresh_token']);
        if (! $tokenModel || ! $tokenModel->can('refresh')) {
            return response()->json([
                'code' => 'invalid_refresh_token',
                'message' => 'Invalid refresh token.',
            ], 401);
        }

        if ($tokenModel->expires_at && $tokenModel->expires_at->isPast()) {
            $tokenModel->delete();

            return response()->json([
                'code' => 'refresh_token_expired',
                'message' => 'Refresh token expired.',
            ], 401);
        }

        $user = $tokenModel->tokenable;
        if (! $user instanceof User || ! $user->is_active) {
            $tokenModel->delete();

            return response()->json([
                'code' => 'account_inactive',
                'message' => 'Account is inactive.',
            ], 403);
        }

        $rememberMe = $tokenModel->can('remember');
        $tokenModel->delete();

        $tokens = $this->issueAuthTokens($user, $rememberMe);

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
            ...$tokens,
            'remember_me' => $rememberMe,
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $payload = $request->validate([
            'email' => ['required', 'email'],
        ]);

        // Generic response to avoid email enumeration.
        try {
            Password::sendResetLink([
                'email' => strtolower(trim((string) $payload['email'])),
            ]);
        } catch (\Throwable $e) {
            report($e);
        }

        return response()->json([
            'code' => 'password_reset_sent',
            'message' => 'If the account exists, a reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request)
    {
        $payload = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required', 'string', 'min:8'],
        ]);

        try {
            $status = Password::reset(
                [
                    'email' => strtolower(trim((string) $payload['email'])),
                    'password' => $payload['password'],
                    'password_confirmation' => $payload['password_confirmation'],
                    'token' => $payload['token'],
                ],
                function (User $user, string $password) {
                    $user->forceFill([
                        'password' => Hash::make($password),
                        'remember_token' => Str::random(60),
                    ])->save();

                    // Revoke existing API sessions on successful password reset.
                    $user->tokens()->delete();
                }
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'code' => 'password_reset_failed',
                'message' => 'Unable to reset password right now.',
            ], 422);
        }

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'code' => 'password_reset_failed',
                'message' => __($status),
            ], 422);
        }

        return response()->json([
            'code' => 'password_reset_success',
            'message' => 'Password reset successful.',
        ]);
    }

    /**
     * @return array{
     *     token:string,
     *     access_token:string,
     *     refresh_token:string,
     *     token_expires_at:?string,
     *     refresh_token_expires_at:?string
     * }
     */
    private function issueAuthTokens(User $user, bool $rememberMe): array
    {
        $accessTtlMinutes = $rememberMe
            ? (int) config('auth_tokens.remember_access_ttl_minutes', 0)
            : (int) config('auth_tokens.access_ttl_minutes', 0);
        $refreshTtlMinutes = $rememberMe
            ? (int) config('auth_tokens.remember_refresh_ttl_minutes', 0)
            : (int) config('auth_tokens.refresh_ttl_minutes', 0);

        $accessExpiresAt = $accessTtlMinutes > 0 ? now()->addMinutes($accessTtlMinutes) : null;
        $refreshExpiresAt = $refreshTtlMinutes > 0 ? now()->addMinutes($refreshTtlMinutes) : null;

        $accessAbilities = ['*'];
        if ($rememberMe) {
            $accessAbilities[] = 'remember';
        }

        $refreshAbilities = ['refresh'];
        if ($rememberMe) {
            $refreshAbilities[] = 'remember';
        }

        $accessToken = $user->createToken('api', $accessAbilities, $accessExpiresAt)->plainTextToken;
        $refreshToken = $user->createToken('refresh', $refreshAbilities, $refreshExpiresAt)->plainTextToken;

        return [
            'token' => $accessToken,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_expires_at' => $accessExpiresAt?->toISOString(),
            'refresh_token_expires_at' => $refreshExpiresAt?->toISOString(),
        ];
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => UserResource::make($request->user()->load('profile')),
        ]);
    }
}
