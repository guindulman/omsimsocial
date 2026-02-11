<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Services\SpamAttemptLogger;
use App\Services\TurnstileVerifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ContactController extends Controller
{
    public function show()
    {
        return view('contact');
    }

    public function store(Request $request, TurnstileVerifier $turnstile, SpamAttemptLogger $spamLogger)
    {
        // Honeypot: bots commonly fill every field. Humans will never see this input.
        if (trim((string) $request->input('company', '')) !== '') {
            $spamLogger->blocked('contact', 'honeypot', $request, [
                'field' => 'company',
            ]);

            return redirect()
                ->route('contact.show')
                ->with('contact_message', "Thanks! We'll get back to you soon.");
        }

        if ($this->hasInvalidFormGuard($request, 'contact')) {
            $spamLogger->blocked('contact', 'form_guard', $request);

            return back()
                ->withErrors(['form' => 'Please wait a moment and try again.'])
                ->withInput();
        }

        if ((bool) config('turnstile.required')) {
            $token = trim((string) $request->input('cf-turnstile-response', ''));
            if ($token === '') {
                $spamLogger->blocked('contact', 'turnstile_missing', $request);

                return back()
                    ->withErrors(['turnstile' => 'Please complete the anti-bot check.'])
                    ->withInput();
            }

            $result = $turnstile->verify($token, $request->ip());
            if (! $result['success']) {
                $spamLogger->blocked('contact', 'turnstile_failed', $request, [
                    'turnstile_errors' => $result['error_codes'] ?? [],
                ]);

                return back()
                    ->withErrors(['turnstile' => 'Anti-bot verification failed. Please try again.'])
                    ->withInput();
            }
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        // Keep this lightweight: many spam runs send several URLs in one message.
        $linkCount = preg_match_all('/(?:https?:\/\/|www\.)/i', (string) $validated['message']);
        if ($linkCount !== false && $linkCount > 3) {
            $spamLogger->blocked('contact', 'too_many_links', $request, [
                'link_count' => $linkCount,
            ]);

            return back()
                ->withErrors(['message' => 'Please reduce links in your message and try again.'])
                ->withInput();
        }

        $fingerprint = hash('sha256', implode('|', [
            strtolower(trim((string) $validated['email'])),
            Str::lower(trim((string) $validated['name'])),
            Str::lower(trim((string) $validated['message'])),
            (string) ($request->ip() ?: 'unknown'),
        ]));

        // Drop repeated payload bursts without punishing normal users.
        if (! Cache::add("contact:dedupe:{$fingerprint}", '1', now()->addMinutes(10))) {
            $spamLogger->blocked('contact', 'duplicate_payload', $request, [
                'fingerprint' => substr($fingerprint, 0, 16),
            ]);

            return redirect()
                ->route('contact.show')
                ->with('contact_message', "Thanks! We'll get back to you soon.");
        }

        $message = "Thanks! We'll get back to you soon.";

        try {
            ContactMessage::query()->create([
                'name' => trim($validated['name']),
                'email' => strtolower(trim($validated['email'])),
                'message' => trim($validated['message']),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Don't crash the page if DB is unavailable/misconfigured.
            Log::error('Contact form submission failed.', [
                'email' => $validated['email'] ?? null,
                'exception' => $e,
            ]);
        }

        return redirect()
            ->route('contact.show')
            ->with('contact_message', $message);
    }

    private function hasInvalidFormGuard(Request $request, string $context): bool
    {
        $issuedAt = (int) $request->input('_issued_at', 0);
        $signature = trim((string) $request->input('_sig', ''));

        if ($issuedAt <= 0 || $signature === '') {
            return true;
        }

        $expected = hash_hmac('sha256', "{$context}|{$issuedAt}", (string) config('app.key'));
        if (! hash_equals($expected, $signature)) {
            return true;
        }

        $ageSeconds = now()->timestamp - $issuedAt;

        return $ageSeconds < 2 || $ageSeconds > 21600;
    }
}
