<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminAuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function show(Request $request)
    {
        if ($request->session()->get('admin_authenticated') === true) {
            return redirect()->route('admin.dashboard');
        }

        return view('admin.login', [
            'adminName' => config('admin.name'),
            'adminEmail' => config('admin.email'),
            'isConfigured' => (string) config('admin.password') !== '',
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $adminEmail = (string) config('admin.email');
        $adminPassword = (string) config('admin.password');

        if ($adminPassword === '') {
            return back()
                ->withErrors(['password' => 'Admin password is not configured. Set ADMIN_PASSWORD in .env.'])
                ->withInput();
        }

        $emailMatches = strcasecmp($request->input('email'), $adminEmail) === 0;
        $passwordMatches = $this->passwordMatches($request->input('password'), $adminPassword);

        if (! $emailMatches || ! $passwordMatches) {
            return back()
                ->withErrors(['email' => 'Invalid admin credentials.'])
                ->withInput();
        }

        $request->session()->regenerate();
        $request->session()->put('admin_authenticated', true);
        $request->session()->put('admin_email', $adminEmail);
        AdminAuditLog::query()->create([
            'actor' => $adminEmail,
            'action' => 'admin.login',
            'metadata' => ['ip' => $request->ip()],
        ]);

        return redirect()->route('admin.dashboard');
    }

    public function logout(Request $request)
    {
        AdminAuditLog::query()->create([
            'actor' => $request->session()->get('admin_email'),
            'action' => 'admin.logout',
            'metadata' => ['ip' => $request->ip()],
        ]);
        $request->session()->forget(['admin_authenticated', 'admin_email']);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login');
    }

    private function passwordMatches(string $input, string $stored): bool
    {
        if ($stored === '') {
            return false;
        }

        if (str_starts_with($stored, '$2y$') || str_starts_with($stored, '$argon2')) {
            return Hash::check($input, $stored);
        }

        return hash_equals($stored, $input);
    }
}
