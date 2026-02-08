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
      <h3>Filters</h3>
      <div class="actions" style="margin-top:12px;">
        <a class="btn {{ $type === '' ? 'btn-primary' : 'btn-ghost' }}" href="{{ route('admin.reports') }}">All</a>
        @foreach ($counts as $row)
          <a class="btn {{ $type === $row->target_type ? 'btn-primary' : 'btn-ghost' }}" href="{{ route('admin.reports', ['type' => $row->target_type]) }}">
            {{ ucfirst(str_replace('_', ' ', $row->target_type)) }} ({{ $row->total }})
          </a>
        @endforeach
      </div>
    </div>

    <div class="card">
      <h3>Open reports</h3>
      @if ($reports->isEmpty())
        <div class="empty">No reports found for this filter.</div>
      @else
        <table class="table">
          <thead>
            <tr>
              <th>Target</th>
              <th>Reporter</th>
              <th>Reason</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @foreach ($reports as $report)
              <tr>
                <td>
                  <strong>{{ ucfirst(str_replace('_', ' ', $report->target_type)) }}</strong>
                  <div class="muted">#{{ $report->target_id }}</div>
                  <div class="muted">{{ $report->created_at?->diffForHumans() }}</div>
                </td>
                <td>
                  <div>{{ $report->reporter->name ?? 'Unknown' }}</div>
                  <div class="muted">{{ $report->reporter->username ?? '' }}</div>
                </td>
                <td>{{ $report->reason }}</td>
                <td class="muted">{{ \Illuminate\Support\Str::limit($report->notes ?? '-', 80) }}</td>
                <td>
                  <div class="actions">
                    <form method="POST" action="{{ route('admin.reports.remove', $report) }}">
                      @csrf
                      <button class="btn btn-primary" type="submit">Remove target</button>
                    </form>
                    <form method="POST" action="{{ route('admin.reports.dismiss', $report) }}">
                      @csrf
                      <button class="btn btn-ghost" type="submit">Dismiss</button>
                    </form>
                  </div>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>

        @if ($reports->hasPages())
          <div style="margin-top:16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            @if ($reports->onFirstPage())
              <span class="badge">Prev</span>
            @else
              <a class="btn btn-ghost" href="{{ $reports->previousPageUrl() }}">Prev</a>
            @endif
            <span class="muted">Page {{ $reports->currentPage() }} of {{ $reports->lastPage() }}</span>
            @if ($reports->hasMorePages())
              <a class="btn btn-ghost" href="{{ $reports->nextPageUrl() }}">Next</a>
            @else
              <span class="badge">Next</span>
            @endif
          </div>
        @endif
      @endif
    </div>
  </div>
@endsection
