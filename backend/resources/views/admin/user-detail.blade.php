@extends('admin.layout')
@php($withSidebar = true)
@php($noteTemplates = config('admin.note_templates', []))

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
    <div class="actions">
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
      <a class="btn btn-ghost" href="{{ route('admin.users') }}">Back to users</a>
      <form method="POST" action="{{ route('admin.logout') }}">
        @csrf
        <button class="btn btn-ghost" type="submit">Log out</button>
      </form>
    </div>
  </div>

  <div class="content">
    <div class="card" style="margin-bottom:24px;">
      <div style="display:flex; flex-wrap:wrap; justify-content:space-between; gap:16px;">
        <div>
          <h3>{{ $user->name }}</h3>
          <div class="muted">{{ '@'.$user->username }}</div>
          <div class="muted">{{ $user->email ?? 'no email' }} / {{ $user->phone ?? 'no phone' }}</div>
        </div>
        <div class="actions">
          <form method="POST" action="{{ route('admin.users.toggle', $user) }}">
            @csrf
            <button class="btn btn-ghost" type="submit">
              {{ $user->is_active ? 'Suspend user' : 'Activate user' }}
            </button>
          </form>
          <form method="POST" action="{{ route('admin.users.moderator', $user) }}">
            @csrf
            <button class="btn btn-primary" type="submit">
              {{ $user->is_moderator ? 'Remove moderator' : 'Make moderator' }}
            </button>
          </form>
        </div>
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:12px;">
        <span class="badge">{{ $user->is_active ? 'Active' : 'Suspended' }}</span>
        <span class="badge">{{ $user->is_moderator ? 'Moderator' : 'Member' }}</span>
        <span class="badge">{{ $user->is_private ? 'Private profile' : 'Public profile' }}</span>
        @if ($lastActivity)
          <span class="badge">
            Last seen {{ \Carbon\Carbon::createFromTimestamp($lastActivity)->diffForHumans() }}
          </span>
        @else
          <span class="badge">No session</span>
        @endif
      </div>
    </div>

    <div class="grid stat-grid" style="margin-bottom:24px;">
      <div class="card stat">
        <span class="muted">Memories</span>
        <h4>{{ number_format($stats['memories']) }}</h4>
      </div>
      <div class="card stat">
        <span class="muted">Comments</span>
        <h4>{{ number_format($stats['comments']) }}</h4>
      </div>
      <div class="card stat">
        <span class="muted">Messages sent</span>
        <h4>{{ number_format($stats['messages_sent']) }}</h4>
      </div>
      <div class="card stat">
        <span class="muted">Messages received</span>
        <h4>{{ number_format($stats['messages_received']) }}</h4>
      </div>
      <div class="card stat">
        <span class="muted">Friends</span>
        <h4>{{ number_format($stats['connections']) }}</h4>
      </div>
      <div class="card stat">
        <span class="muted">Reports against</span>
        <h4>{{ number_format($stats['reports_against']) }}</h4>
      </div>
    </div>

    <div class="split">
      <div class="grid" style="gap:24px;">
        <div class="card">
          <h3>Moderation notes</h3>
          @if ($errors->any())
            <div class="card" style="background: rgba(225, 29, 72, 0.15); border-color: rgba(225, 29, 72, 0.35); margin-top:12px;">
              <strong style="display:block; font-size:13px; margin-bottom:4px;">Action failed</strong>
              <span class="muted">{{ $errors->first() }}</span>
            </div>
          @endif
          <form method="POST" action="{{ route('admin.users.note', $user) }}" style="margin-top:12px; display:grid; gap:10px;">
            @csrf
            <select name="note_template" class="note-template" data-target="note-user-detail" style="padding:10px 12px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);">
              <option value="">Choose template</option>
              @foreach ($noteTemplates as $template)
                <option value="{{ $template['key'] }}" data-body="{{ e($template['body']) }}">{{ $template['label'] }}</option>
              @endforeach
            </select>
            <textarea id="note-user-detail" name="note" rows="4" placeholder="Add moderation note..." style="width:100%; padding:12px 14px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);"></textarea>
            <button class="btn btn-ghost" type="submit">Save note</button>
          </form>
          <div style="margin-top:16px;">
            @if ($notes->isEmpty())
              <div class="empty">No notes yet.</div>
            @else
              <ul style="display:grid; gap:10px;">
                @foreach ($notes as $note)
                  <li class="card" style="padding:12px;">
                    <div class="muted">{{ $note->author ?? 'admin' }} - {{ $note->created_at?->diffForHumans() }}</div>
                    <div style="margin-top:6px;">{{ $note->note }}</div>
                  </li>
                @endforeach
              </ul>
            @endif
          </div>
        </div>

        <div class="card">
          <h3>Recent memories</h3>
          @if ($recentMemories->isEmpty())
            <div class="empty">No memories posted.</div>
          @else
            <table class="table">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Preview</th>
                </tr>
              </thead>
              <tbody>
                @foreach ($recentMemories as $memory)
                  <tr>
                    <td class="muted">{{ $memory->created_at?->diffForHumans() }}</td>
                    <td>{{ \Illuminate\Support\Str::limit($memory->body ?? 'Media post', 80) }}</td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @endif
        </div>
      </div>

      <div class="grid" style="gap:24px;">
        <div class="card">
          <h3>Recent comments</h3>
          @if ($recentComments->isEmpty())
            <div class="empty">No comments yet.</div>
          @else
            <table class="table">
              <thead>
                <tr>
                  <th>Comment</th>
                  <th>On memory</th>
                </tr>
              </thead>
              <tbody>
                @foreach ($recentComments as $comment)
                  <tr>
                    <td>{{ \Illuminate\Support\Str::limit($comment->body, 70) }}</td>
                    <td class="muted">#{{ $comment->memory_id }}</td>
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
                </tr>
              </thead>
              <tbody>
                @foreach ($recentMessages as $message)
                  <tr>
                    <td class="muted">{{ $message->sender->name ?? 'Unknown' }} -> {{ $message->recipient->name ?? 'Unknown' }}</td>
                    <td>{{ \Illuminate\Support\Str::limit($message->body ?? 'Media message', 60) }}</td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @endif
        </div>

        <div class="card">
          <h3>Reports against user</h3>
          @if ($reportsAgainst->isEmpty())
            <div class="empty">No reports against this user.</div>
          @else
            <table class="table">
              <thead>
                <tr>
                  <th>Reason</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                @foreach ($reportsAgainst as $report)
                  <tr>
                    <td>{{ $report->reason }}</td>
                    <td class="muted">{{ $report->created_at?->diffForHumans() }}</td>
                  </tr>
                @endforeach
              </tbody>
            </table>
          @endif
        </div>
      </div>
    </div>
  </div>

  <script>
    document.querySelectorAll('.note-template').forEach((select) => {
      select.addEventListener('change', (event) => {
        const option = select.options[select.selectedIndex];
        const body = option.dataset.body || '';
        const targetId = select.dataset.target;
        if (!body || !targetId) return;
        const textarea = document.getElementById(targetId);
        if (!textarea) return;
        if (textarea.value.trim() === '') {
          textarea.value = body;
        } else if (!textarea.value.includes(body)) {
          textarea.value = body + "\n\n" + textarea.value;
        }
      });
    });
  </script>
@endsection
