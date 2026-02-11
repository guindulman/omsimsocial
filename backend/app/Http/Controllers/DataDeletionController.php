<?php

namespace App\Http\Controllers;

use App\Mail\DataDeletionRequestSubmitted;
use App\Models\DataDeletionRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
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
            throw ValidationException::withMessages([
                'website' => 'Invalid submission.',
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
}

