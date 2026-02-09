<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Profile;
use App\Models\User;
use App\Services\TurnstileVerifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, TurnstileVerifier $turnstile)
    {
        if ((bool) config('turnstile.required')) {
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
        }

        $payload = $request->validated();

        $user = User::query()->create([
            'name' => $payload['name'],
            'username' => $payload['username'],
            'email' => $payload['email'] ?? null,
            'phone' => $payload['phone'] ?? null,
            'password' => Hash::make($payload['password']),
        ]);

        Profile::query()->create([
            'user_id' => $user->id,
            'privacy_prefs' => [
                'show_city' => true,
                'allow_invites' => true,
            ],
        ]);

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
            'token' => $token,
        ], 201);
    }

    public function antiBot()
    {
        return response()->json([
            'turnstile' => [
                'required' => (bool) config('turnstile.required'),
                'path' => '/auth/turnstile',
            ],
        ]);
    }

    public function turnstile()
    {
        $siteKey = trim((string) config('turnstile.site'));
        $required = (bool) config('turnstile.required');

        if ($siteKey === '') {
            $html = <<<'HTML'
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
        function post(obj) {
          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(obj));
          }
        }
        post({ type: "turnstile_status", required: false, configured: false });
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

      function onTurnstileLoad() {
        post({ type: "turnstile_status", required: {$requiredJson}, configured: true });
        try {
          turnstile.render("#turnstile", {
            sitekey: "{$siteKeyEscaped}",
            callback: function (token) {
              post({ type: "turnstile_token", token: token });
            },
            "expired-callback": function () {
              post({ type: "turnstile_expired" });
            },
            "error-callback": function () {
              post({ type: "turnstile_error" });
            },
          });
        } catch (e) {
          post({ type: "turnstile_error" });
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

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => UserResource::make($user->load('profile')),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out.']);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => UserResource::make($request->user()->load('profile')),
        ]);
    }
}
