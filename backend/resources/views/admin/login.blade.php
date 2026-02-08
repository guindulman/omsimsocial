@extends('admin.layout')
@php($withSidebar = false)

@section('content')
  <div class="topbar">
    <div class="brand">
      <a href="{{ route('admin.dashboard') }}" class="brand-logo-link">
        <img
          src="{{ asset('assets/omsim-logo.png') }}"
          alt="Omsim"
          class="brand-logo brand-logo--topbar"
          loading="eager"
          decoding="async"
        />
      </a>
    </div>
    <div class="actions" style="align-items:center;">
      <button type="button" class="icon-btn" data-admin-theme-toggle aria-pressed="false">
        <span class="sr-only">Toggle theme</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="theme-icon theme-icon--moon">
          <path d="M21 14.5A8.5 8.5 0 019.5 3a7 7 0 1011.5 11.5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
        </svg>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="theme-icon theme-icon--sun">
          <path d="M12 3v2M12 19v2M4.22 4.22l1.41 1.41M18.36 18.36l1.41 1.41M3 12h2M19 12h2M4.22 19.78l1.41-1.41M18.36 5.64l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path d="M12 17a5 5 0 100-10 5 5 0 000 10z" stroke="currentColor" stroke-width="2" />
        </svg>
      </button>
      <span class="pill">Admin Console</span>
    </div>
  </div>

  <div class="content" style="display:flex; align-items:center; justify-content:center;">
    <div class="card" style="max-width:420px; width:100%; padding:28px;">
      <div style="display:flex; justify-content:center; margin-bottom:16px;">
        <img src="{{ asset('assets/omsim-logo.png') }}" alt="Omsim logo" style="max-width:220px; width:100%; height:auto;">
      </div>
      <h2 style="font-size:22px; margin-bottom:8px;">Welcome back</h2>
      <p class="muted" style="margin-bottom:16px;">
        Sign in to monitor mobile status and keep Omsim safe.
      </p>

      @if (! $isConfigured)
        <div class="card" style="background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.35); margin-bottom:16px;">
          <strong style="display:block; font-size:13px; margin-bottom:4px;">Admin password not set</strong>
          <span class="muted">Add ADMIN_EMAIL and ADMIN_PASSWORD to your backend .env.</span>
        </div>
      @endif

      @if ($errors->any())
        <div class="card" style="background: rgba(225, 29, 72, 0.15); border-color: rgba(225, 29, 72, 0.35); margin-bottom:16px;">
          <strong style="display:block; font-size:13px; margin-bottom:4px;">Login failed</strong>
          <span class="muted">{{ $errors->first() }}</span>
        </div>
      @endif

      <form method="POST" action="{{ route('admin.login.submit') }}">
        @csrf
        <div style="display:grid; gap:12px;">
          <label style="font-size:12px; color:var(--muted);">
            Email
            <input
              type="email"
              name="email"
              value="{{ old('email', $adminEmail ?? '') }}"
              required
              style="width:100%; margin-top:6px; padding:12px 14px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);"
            >
          </label>
          <label style="font-size:12px; color:var(--muted);">
            Password
            <input
              type="password"
              name="password"
              required
              style="width:100%; margin-top:6px; padding:12px 14px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);"
            >
          </label>
        </div>

        <div style="margin-top:18px; display:flex; gap:10px; align-items:center;">
          <button class="btn btn-primary" type="submit">Enter Dashboard</button>
          <a href="{{ route('landing') }}" class="btn btn-ghost">Back to site</a>
        </div>
      </form>
    </div>
  </div>
@endsection
