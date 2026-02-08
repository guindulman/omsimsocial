@extends('admin.layout')
@php($withSidebar = true)

@section('content')
  <div class="topbar">
    <div class="brand">
      <button
        type="button"
        class="icon-btn icon-btn--menu"
        data-admin-mobile-nav-trigger
        aria-controls="admin-mobile-nav"
        aria-expanded="false"
      >
        <span class="sr-only">Open menu</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none">
          <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
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
      <form method="POST" action="{{ route('admin.logout') }}">
        @csrf
        <button class="btn btn-ghost" type="submit">Log out</button>
      </form>
    </div>
  </div>

  <div class="content">
    <div class="card" style="margin-bottom:24px;">
      <h3>Search actions</h3>
      <form method="GET" action="{{ route('admin.audit') }}" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-top:12px;">
        <input
          type="text"
          name="action"
          value="{{ $action }}"
          placeholder="Filter by action (e.g. user.toggle, report.remove)"
          style="flex:1; min-width:220px; padding:12px 14px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);"
        >
        <button class="btn btn-primary" type="submit">Search</button>
        @if ($action !== '')
          <a class="btn btn-ghost" href="{{ route('admin.audit') }}">Clear</a>
        @endif
      </form>
    </div>

    <div class="card">
      <h3>Recent activity</h3>
      @if ($logs->isEmpty())
        <div class="empty">No audit logs yet.</div>
      @else
        <table class="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            @foreach ($logs as $log)
              <tr>
                <td class="muted">{{ $log->created_at?->diffForHumans() }}</td>
                <td>{{ $log->actor ?? 'admin' }}</td>
                <td><span class="badge">{{ $log->action }}</span></td>
                <td class="muted">{{ $log->target_type ?? '-' }} {{ $log->target_id ? '#'.$log->target_id : '' }}</td>
                <td class="muted">{{ $log->metadata ? \Illuminate\Support\Str::limit(json_encode($log->metadata), 80) : '-' }}</td>
              </tr>
            @endforeach
          </tbody>
        </table>

        @if ($logs->hasPages())
          <div style="margin-top:16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            @if ($logs->onFirstPage())
              <span class="badge">Prev</span>
            @else
              <a class="btn btn-ghost" href="{{ $logs->previousPageUrl() }}">Prev</a>
            @endif
            <span class="muted">Page {{ $logs->currentPage() }} of {{ $logs->lastPage() }}</span>
            @if ($logs->hasMorePages())
              <a class="btn btn-ghost" href="{{ $logs->nextPageUrl() }}">Next</a>
            @else
              <span class="badge">Next</span>
            @endif
          </div>
        @endif
      @endif
    </div>
  </div>
@endsection
