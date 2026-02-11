@extends('admin.layout')
@php
  $withSidebar = true;
@endphp

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
    <div class="grid stat-grid" style="margin-bottom:24px;">
      <div class="card stat">
        <span class="muted">Blocked attempts (24h)</span>
        <h4>{{ number_format($stats['last_24h']) }}</h4>
        <span>Total from all protected forms</span>
      </div>
      <div class="card stat">
        <span class="muted">Contact form (24h)</span>
        <h4>{{ number_format($stats['contact_24h']) }}</h4>
        <span>Public contact endpoint</span>
      </div>
      <div class="card stat">
        <span class="muted">Data deletion form (24h)</span>
        <h4>{{ number_format($stats['data_deletion_24h']) }}</h4>
        <span>Delete-data request endpoint</span>
      </div>
      <div class="card stat">
        <span class="muted">Top reason (24h)</span>
        <h4>{{ $stats['top_reason_24h'] ? ucfirst(str_replace('_', ' ', $stats['top_reason_24h'])) : 'None' }}</h4>
        <span>Most frequent block signal</span>
      </div>
    </div>

    <div class="card" style="margin-bottom:24px;">
      <h3>Filters</h3>
      <form method="GET" action="{{ route('admin.spam-guard') }}" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-top:12px;">
        <label class="muted" style="display:flex; flex-direction:column; gap:6px;">
          Surface
          <select name="surface" style="padding:11px 12px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);">
            <option value="">All</option>
            @foreach ($surfaceOptions as $option)
              <option value="{{ $option }}" @selected($surface === $option)>
                {{ ucfirst(str_replace('_', ' ', $option)) }}
              </option>
            @endforeach
          </select>
        </label>

        <label class="muted" style="display:flex; flex-direction:column; gap:6px;">
          Reason
          <select name="reason" style="padding:11px 12px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);">
            <option value="">All</option>
            @foreach ($reasonOptions as $option)
              <option value="{{ $option }}" @selected($reason === $option)>
                {{ ucfirst(str_replace('_', ' ', $option)) }}
              </option>
            @endforeach
          </select>
        </label>

        <label class="muted" style="display:flex; flex-direction:column; gap:6px;">
          Window (hours)
          <input
            type="number"
            name="hours"
            min="1"
            max="168"
            value="{{ $hours }}"
            style="padding:11px 12px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);"
          >
        </label>

        <div class="actions" style="align-items:flex-end;">
          <button class="btn btn-primary" type="submit">Apply</button>
          <a class="btn btn-ghost" href="{{ route('admin.spam-guard') }}">Reset</a>
        </div>
      </form>
    </div>

    <div class="split">
      <div class="card">
        <h3>Blocked attempts</h3>
        @if ($logs->isEmpty())
          <div class="empty">No blocked attempts for this filter window.</div>
        @else
          <table class="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Surface</th>
                <th>Reason</th>
                <th>IP</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              @foreach ($logs as $log)
                @php
                  $parts = explode('.', $log->action);
                  $surfacePart = $parts[2] ?? 'unknown';
                  $reasonPart = $parts[3] ?? 'unknown';
                  $metadata = is_array($log->metadata) ? $log->metadata : [];
                @endphp
                <tr>
                  <td class="muted">{{ $log->created_at?->diffForHumans() }}</td>
                  <td>
                    <span class="badge badge--accent">{{ ucfirst(str_replace('_', ' ', $surfacePart)) }}</span>
                  </td>
                  <td>
                    <span class="badge badge--warn">{{ ucfirst(str_replace('_', ' ', $reasonPart)) }}</span>
                  </td>
                  <td class="muted">{{ $metadata['ip'] ?? '-' }}</td>
                  <td class="muted">
                    @if (! empty($metadata['email_sha256']))
                      email#{{ substr((string) $metadata['email_sha256'], 0, 10) }}
                    @endif
                    @if (! empty($metadata['username_sha256']))
                      {{ ! empty($metadata['email_sha256']) ? ' / ' : '' }}user#{{ substr((string) $metadata['username_sha256'], 0, 10) }}
                    @endif
                    @if (! empty($metadata['field']))
                      {{ (! empty($metadata['email_sha256']) || ! empty($metadata['username_sha256'])) ? ' / ' : '' }}field: {{ $metadata['field'] }}
                    @endif
                    @if (! empty($metadata['link_count']))
                      {{ (! empty($metadata['email_sha256']) || ! empty($metadata['username_sha256']) || ! empty($metadata['field'])) ? ' / ' : '' }}links: {{ $metadata['link_count'] }}
                    @endif
                    @if (empty($metadata['email_sha256']) && empty($metadata['username_sha256']) && empty($metadata['field']) && empty($metadata['link_count']))
                      -
                    @endif
                  </td>
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

      <div class="card">
        <h3>Top source IPs (24h)</h3>
        @if ($topIps->isEmpty())
          <div class="empty">No blocked IPs in the last 24 hours.</div>
        @else
          <table class="table">
            <thead>
              <tr>
                <th>IP</th>
                <th>Blocked count</th>
              </tr>
            </thead>
            <tbody>
              @foreach ($topIps as $ip => $count)
                <tr>
                  <td>{{ $ip }}</td>
                  <td><span class="badge badge--danger">{{ $count }}</span></td>
                </tr>
              @endforeach
            </tbody>
          </table>
        @endif
      </div>
    </div>
  </div>
@endsection
