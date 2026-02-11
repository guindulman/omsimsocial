<?php

namespace App\Http\Controllers;

use App\Mail\DataDeletionRequestSubmitted;
use App\Models\DataDeletionRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DataDeletionController extends Controller
{
    public function show()
    {
        return view('legal.data-deletion', [
            'appName' => (string) config('privacy.app_name', 'Omsim Social'),
            'privacyEmail' => (string) config('privacy.contact_email', 'mailer@omsimsocial.com'),
        ]);
    }

    public function submit(Request $request)
    {
        // Honeypot: bots often fill hidden fields automatically.
        if (trim((string) $request->input('website', '')) !== '') {
            return redirect()
                ->route('data-deletion.show')
                ->with('data_deletion_message', 'Your request has been received. If valid, we will process it.');
        }

        if ($this->hasInvalidFormGuard($request, 'data-deletion')) {
            throw ValidationException::withMessages([
                'form' => 'Please wait a moment and try again.',
            ]);
        }

        $allowedTypes = ['profile', 'ugc', 'messages', 'account'];
        $validated = $request->validate([
            'full_name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email', 'required_without:username'],
            'username' => ['nullable', 'string', 'max:60', 'required_without:email'],
            'request_types' => ['required', 'array', 'min:1'],
            'request_types.*' => ['required', 'string', 'distinct', Rule::in($allowedTypes)],
            'details' => ['nullable', 'string', 'max:5000'],
        ]);

        $requestTypes = $validated['request_types'];
        sort($requestTypes);

        $fingerprint = hash('sha256', implode('|', [
            strtolower(trim((string) ($validated['email'] ?? ''))),
            Str::lower(trim((string) ($validated['username'] ?? ''))),
            implode(',', $requestTypes),
            Str::lower(trim((string) ($validated['details'] ?? ''))),
            (string) ($request->ip() ?: 'unknown'),
        ]));

        if (! Cache::add("data-deletion:dedupe:{$fingerprint}", '1', now()->addMinutes(30))) {
            return redirect()
                ->route('data-deletion.show')
                ->with('data_deletion_message', 'Your request has been received. If valid, we will process it.');
        }

        $deletionRequest = DataDeletionRequest::query()->create([
            'app_name' => (string) config('privacy.app_name', 'Omsim Social'),
            'full_name' => $validated['full_name'] ?? null,
            'email' => isset($validated['email']) ? strtolower(trim((string) $validated['email'])) : null,
            'username' => isset($validated['username']) ? trim((string) $validated['username']) : null,
            'request_types' => $validated['request_types'],
            'details' => $validated['details'] ?? null,
            'status' => 'new',
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
        ]);

        Mail::to((string) config('privacy.contact_email', 'mailer@omsimsocial.com'))
            ->send(new DataDeletionRequestSubmitted($deletionRequest));

        return redirect()
            ->route('data-deletion.show')
            ->with('data_deletion_message', 'Your data deletion request has been submitted. Request ID: #'.$deletionRequest->id);
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
