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
    <div style="display:flex; align-items:center; gap:12px;">
      <span class="pill">Last sync {{ $now->format('M d, H:i') }}</span>
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
        <span class="muted">Total users</span>
        <h4>{{ number_format($stats['users_total']) }}</h4>
        <span>{{ number_format($stats['users_active']) }} active / {{ number_format($stats['users_online']) }} online</span>
      </div>
      <div class="card stat">
        <span class="muted">New users (7d)</span>
        <h4>{{ number_format($stats['users_new_7d']) }}</h4>
        <span>{{ number_format($stats['users_private']) }} private profiles</span>
      </div>
      <div class="card stat">
        <span class="muted">Moderators</span>
        <h4>{{ number_format($stats['users_moderators']) }}</h4>
        <span>Community guardians</span>
      </div>
      <div class="card stat">
        <span class="muted">Memories</span>
        <h4>{{ number_format($stats['memories_total']) }}</h4>
        <span>{{ number_format($stats['memories_today']) }} posted today</span>
      </div>
      <div class="card stat">
        <span class="muted">Messages (24h)</span>
        <h4>{{ number_format($stats['messages_24h']) }}</h4>
        <span>{{ number_format($stats['comments_total']) }} comments overall</span>
      </div>
      <div class="card stat">
        <span class="muted">Live signals</span>
        <h4>{{ number_format($stats['live_rooms']) }}</h4>
        <span>{{ number_format($stats['calls_active']) }} calls active</span>
      </div>
      <div class="card stat">
        <span class="muted">Open reports</span>
        <h4>{{ number_format($stats['reports_open']) }}</h4>
        <span>{{ number_format($stats['connections_pending']) }} pending connections</span>
      </div>
    </div>

    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom:24px;">
      <div class="card glow">
        <h3>Quick actions</h3>
        <p class="muted" style="margin-bottom:12px;">Jump into user management or clear reports.</p>
        <div class="actions">
          <a href="{{ route('admin.users') }}" class="btn btn-primary">Manage users</a>
          <a href="{{ route('admin.reports') }}" class="btn btn-ghost">Review reports</a>
          <a href="{{ route('admin.audit') }}" class="btn btn-ghost">Audit log</a>
          <a href="{{ route('admin.spam-guard') }}" class="btn btn-ghost">Spam guard</a>
        </div>
      </div>
      <div class="card">
        <h3>Ops notes</h3>
        <p class="muted">Keep your moderation team synced with live room activity, story expirations, and message surges.</p>
      </div>
    </div>

    <div class="card" style="margin-bottom:24px;">
      <h3>Mobile status</h3>
      <div class="grid health-grid">
        <div class="health-item">
          <div>
            <strong>API + DB</strong>
            <div class="muted">Core services</div>
          </div>
          <div class="status">
            <span class="dot {{ $health['database'] ? '' : 'danger' }}"></span>
            {{ $health['database'] ? 'Operational' : 'Offline' }}
          </div>
        </div>
        <div class="health-item">
          <div>
            <strong>Realtime</strong>
            <div class="muted">Reverb channel</div>
          </div>
          <div class="status">
            <span class="dot {{ $health['realtime'] ? '' : 'warn' }}"></span>
            {{ $health['realtime'] ? 'Configured' : 'Check config' }}
          </div>
        </div>
        <div class="health-item">
          <div>
            <strong>Storage</strong>
            <div class="muted">Media uploads</div>
          </div>
          <div class="status">
            <span class="dot {{ $health['storage'] ? '' : 'warn' }}"></span>
            {{ $health['storage'] ? 'Public disk' : 'Verify disk' }}
          </div>
        </div>
        <div class="health-item">
          <div>
            <strong>Messaging</strong>
            <div class="muted">Direct messages</div>
          </div>
          <div class="status">
            <span class="dot {{ $health['messaging'] ? '' : 'warn' }}"></span>
            {{ $health['messaging'] ? 'Active' : 'Idle' }}
          </div>
        </div>
        <div class="health-item">
          <div>
            <strong>Calls</strong>
            <div class="muted">Voice/video</div>
          </div>
          <div class="status">
            <span class="dot {{ $health['calls'] ? '' : 'warn' }}"></span>
            {{ $health['calls'] ? 'In progress' : 'Quiet' }}
          </div>
        </div>
        <div class="health-item">
          <div>
            <strong>Stories</strong>
            <div class="muted">Expiring content</div>
          </div>
          <div class="status">
            <span class="dot {{ $health['stories'] ? '' : 'warn' }}"></span>
            {{ $health['stories'] ? 'Live' : 'None' }}
          </div>
        </div>
      </div>
    </div>

    <div class="split">
      <div class="grid" style="gap:24px;">
        <div class="card" id="reports">
          <h3>Moderation queue</h3>
          @if ($recentReports->isEmpty())
            <div class="empty">No reports right now.</div>
          @else
            <table class="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Reporter</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @foreach ($recentReports as $report)
                  <tr>
                    <td>
                      <div>
                        <strong>{{ ucfirst(str_replace('_', ' ', $report->target_type)) }}</strong>
                        <div class="muted">#{{ $report->target_id }}</div>
                      </div>
                    </td>
                    <td>
                      <div>{{ $report->reporter->name ?? 'Unknown' }}</div>
                      <div class="muted">{{ $report->created_at?->diffForHumans() }}</div>
                    </td>
                    <td>
                      <div>{{ $report->reason }}</div>
                      @if ($report->notes)
                        <div class="muted">{{ \Illuminate\Support\Str::limit($report->notes, 60) }}</div>
                      @endif
                    </td>
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
          @endif
        </div>

        <div class="card">
          <h3>Recent memories</h3>
          @if ($recentMemories->isEmpty())
            <div class="empty">No memories posted yet.</div>
          @else
            <table class="table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @foreach ($recentMemories as $memory)
                  <tr>
                    <td>
                      <div>{{ $memory->author->name ?? 'Unknown' }}</div>
                      <div class="muted">{{ $memory->created_at?->diffForHumans() }}</div>
                    </td>
                    <td>
                      {{ \Illuminate\Support\Str::limit($memory->body ?? 'Media post', 80) }}
                    </td>
                    <td>
                      <form method="POST" action="{{ route('admin.memories.delete', $memory) }}">
                        @csrf
                        @method('DELETE')
                        <button class="btn btn-danger" type="submit">Delete</button>
                      </form>
                    </td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @endif
        </div>
      </div>

      <div class="grid" style="gap:24px;">
        <div class="card">
          <h3>Recent users</h3>
          @if ($recentUsers->isEmpty())
            <div class="empty">No users found.</div>
          @else
            <table class="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @foreach ($recentUsers as $user)
                  <tr>
                    <td>
                      <div>{{ $user->name }}</div>
                      <div class="muted">{{ $user->username }}</div>
                    </td>
                    <td>
                      <span class="badge">{{ $user->is_active ? 'Active' : 'Suspended' }}</span>
                    </td>
                    <td>
                      <form method="POST" action="{{ route('admin.users.toggle', $user) }}">
                        @csrf
                        <button class="btn btn-ghost" type="submit">
                          {{ $user->is_active ? 'Suspend' : 'Activate' }}
                        </button>
                      </form>
                    </td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @endif
        </div>

        <div class="card">
          <h3>Recent messages</h3>
          @if ($recentMessages->isEmpty())
            <div class="empty">No messages yet.</div>
          @else
            <table class="table">
              <thead>
                <tr>
                  <th>From -> To</th>
                  <th>Preview</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @foreach ($recentMessages as $message)
                  <tr>
                    <td>
                      <div>{{ $message->sender->name ?? 'Unknown' }} -> {{ $message->recipient->name ?? 'Unknown' }}</div>
                      <div class="muted">{{ $message->created_at?->diffForHumans() }}</div>
                    </td>
                    <td>
                      {{ \Illuminate\Support\Str::limit($message->body ?? 'Media message', 60) }}
                    </td>
                    <td>
                      <form method="POST" action="{{ route('admin.messages.delete', $message) }}">
                        @csrf
                        @method('DELETE')
                        <button class="btn btn-danger" type="submit">Remove</button>
                      </form>
                    </td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @endif
        </div>
      </div>
    </div>
  </div>
@endsection
