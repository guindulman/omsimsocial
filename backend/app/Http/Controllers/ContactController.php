<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function show()
    {
        return view('contact');
    }

    public function store(Request $request)
    {
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

