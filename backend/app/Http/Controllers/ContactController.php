<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Services\TurnstileVerifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function show()
    {
        return view('contact');
    }

    public function store(Request $request, TurnstileVerifier $turnstile)
    {
        // Honeypot: bots commonly fill every field. Humans will never see this input.
        if (trim((string) $request->input('company', '')) !== '') {
            return redirect()
                ->route('contact.show')
                ->with('contact_message', "Thanks! We'll get back to you soon.");
        }

        if ((bool) config('turnstile.required')) {
            $token = trim((string) $request->input('cf-turnstile-response', ''));
            if ($token === '') {
                return back()
                    ->withErrors(['turnstile' => 'Please complete the anti-bot check.'])
                    ->withInput();
            }

            $result = $turnstile->verify($token, $request->ip());
            if (! $result['success']) {
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
}
