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
    <div style="display:flex; align-items:center; gap:12px;">
      <span class="pill">{{ number_format($stats['online']) }} online now</span>
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
        <h4>{{ number_format($stats['total']) }}</h4>
      </div>
      <div class="card stat">
        <span class="muted">Active</span>
        <h4>{{ number_format($stats['active']) }}</h4>
      </div>
      <div class="card stat">
        <span class="muted">Moderators</span>
        <h4>{{ number_format($stats['moderators']) }}</h4>
      </div>
      <div class="card stat">
        <span class="muted">Online now</span>
        <h4>{{ number_format($stats['online']) }}</h4>
      </div>
    </div>

    <div class="card" style="margin-bottom:24px;">
      <h3>Find users</h3>
      @if ($errors->any())
        <div class="card" style="background: rgba(225, 29, 72, 0.15); border-color: rgba(225, 29, 72, 0.35); margin-top:12px;">
          <strong style="display:block; font-size:13px; margin-bottom:4px;">Action failed</strong>
          <span class="muted">{{ $errors->first() }}</span>
        </div>
      @endif
      <form method="GET" action="{{ route('admin.users') }}" style="display:flex; flex-wrap:wrap; gap:12px; align-items:center; margin-top:12px;">
        @if ($filter !== '')
          <input type="hidden" name="filter" value="{{ $filter }}">
        @endif
        <input
          type="text"
          name="q"
          value="{{ $search }}"
          placeholder="Search name, username, email, phone"
          style="flex:1; min-width:220px; padding:12px 14px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);"
        >
        <button class="btn btn-primary" type="submit">Search</button>
        @if ($search !== '')
          <a class="btn btn-ghost" href="{{ route('admin.users', ['filter' => $filter]) }}">Clear</a>
        @endif
      </form>
      <div class="actions" style="margin-top:16px;">
        <a class="btn {{ $filter === '' ? 'btn-primary' : 'btn-ghost' }}" href="{{ route('admin.users') }}">All</a>
        <a class="btn {{ $filter === 'active' ? 'btn-primary' : 'btn-ghost' }}" href="{{ route('admin.users', ['filter' => 'active']) }}">Active</a>
        <a class="btn {{ $filter === 'suspended' ? 'btn-primary' : 'btn-ghost' }}" href="{{ route('admin.users', ['filter' => 'suspended']) }}">Suspended</a>
        <a class="btn {{ $filter === 'moderators' ? 'btn-primary' : 'btn-ghost' }}" href="{{ route('admin.users', ['filter' => 'moderators']) }}">Moderators</a>
        <a class="btn {{ $filter === 'private' ? 'btn-primary' : 'btn-ghost' }}" href="{{ route('admin.users', ['filter' => 'private']) }}">Private</a>
        <a class="btn {{ $filter === 'new' ? 'btn-primary' : 'btn-ghost' }}" href="{{ route('admin.users', ['filter' => 'new']) }}">New 7d</a>
      </div>
    </div>

    <div class="card">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
        <h3>Users</h3>
        <form id="bulk-users-form" method="POST" action="{{ route('admin.users.bulk') }}" class="actions" style="align-items:center;">
          @csrf
          <select name="action" style="padding:8px 12px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);">
            <option value="">Bulk action</option>
            <option value="suspend">Suspend</option>
            <option value="activate">Activate</option>
            <option value="make_moderator">Make moderator</option>
            <option value="remove_moderator">Remove moderator</option>
            <option value="add_note">Add moderation note</option>
          </select>
          <button class="btn btn-primary" type="submit">Apply</button>
        </form>
      </div>
      <div style="display:grid; gap:10px; margin-top:12px;">
        <strong class="muted">Bulk note (optional)</strong>
        <div class="actions">
          <select name="note_template" class="note-template" data-target="bulk-note" form="bulk-users-form" style="padding:10px 12px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);">
            <option value="">Choose template</option>
            @foreach ($noteTemplates as $template)
              <option value="{{ $template['key'] }}" data-body="{{ e($template['body']) }}">{{ $template['label'] }}</option>
            @endforeach
          </select>
          <textarea id="bulk-note" name="note" rows="2" placeholder="Optional custom note..." form="bulk-users-form" style="flex:1; min-width:220px; padding:10px 12px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);"></textarea>
        </div>
      </div>
      @if ($users->isEmpty())
        <div class="empty">No users found for this filter.</div>
      @else
        <table class="table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" id="select-all" style="width:16px; height:16px;">
              </th>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last seen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @foreach ($users as $user)
              @php($lastSeen = $lastSeenMap[$user->id] ?? null)
              @php($note = $noteMap[$user->id] ?? null)
              @php($noteCount = $noteCounts[$user->id] ?? 0)
              <tr>
                <td>
                  <input type="checkbox" name="user_ids[]" value="{{ $user->id }}" class="user-select" form="bulk-users-form" style="width:16px; height:16px;">
                </td>
                <td>
                  <div><a href="{{ route('admin.users.show', $user) }}">{{ $user->name }}</a></div>
                  <div class="muted">{{ '@'.$user->username }} / {{ $user->email ?? 'no email' }}</div>
                </td>
                <td>
                  <span class="badge">{{ $user->is_moderator ? 'Moderator' : 'Member' }}</span>
                </td>
                <td>
                  <span class="badge">{{ $user->is_active ? 'Active' : 'Suspended' }}</span>
                  @if ($user->is_private)
                    <span class="badge">Private</span>
                  @endif
                </td>
                <td>
                  @if ($lastSeen)
                    <div>{{ \Carbon\Carbon::createFromTimestamp($lastSeen)->diffForHumans() }}</div>
                    <div class="muted">
                      <span class="dot {{ $lastSeen >= $onlineCutoff ? '' : 'warn' }}"></span>
                      {{ $lastSeen >= $onlineCutoff ? 'Online' : 'Offline' }}
                    </div>
                  @else
                    <div class="muted">No session</div>
                  @endif
                  <details style="margin-top:8px;">
                    <summary class="muted" style="cursor:pointer;">Notes ({{ $noteCount }})</summary>
                    @if ($note)
                      <div class="muted" style="margin-top:6px;">Latest: {{ \Illuminate\Support\Str::limit($note->note, 80) }}</div>
                    @endif
                    <form method="POST" action="{{ route('admin.users.note', $user) }}" style="margin-top:8px; display:grid; gap:8px;">
                      @csrf
                      <select name="note_template" class="note-template" data-target="note-{{ $user->id }}" style="padding:10px 12px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);">
                        <option value="">Choose template</option>
                        @foreach ($noteTemplates as $template)
                          <option value="{{ $template['key'] }}" data-body="{{ e($template['body']) }}">{{ $template['label'] }}</option>
                        @endforeach
                      </select>
                      <textarea id="note-{{ $user->id }}" name="note" rows="3" placeholder="Add moderator note..." style="width:100%; padding:10px 12px; border-radius:12px; border:1px solid var(--border); background:var(--surface-alt); color:var(--text);"></textarea>
                      <button class="btn btn-ghost" type="submit">Save note</button>
                    </form>
                  </details>
                </td>
                <td>
                  <div class="actions">
                    <form method="POST" action="{{ route('admin.users.toggle', $user) }}">
                      @csrf
                      <button class="btn btn-ghost" type="submit">
                        {{ $user->is_active ? 'Suspend' : 'Activate' }}
                      </button>
                    </form>
                    <form method="POST" action="{{ route('admin.users.moderator', $user) }}">
                      @csrf
                      <button class="btn btn-primary" type="submit">
                        {{ $user->is_moderator ? 'Remove mod' : 'Make mod' }}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            @endforeach
          </tbody>
        </table>

        @if ($users->hasPages())
          <div style="margin-top:16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            @if ($users->onFirstPage())
              <span class="badge">Prev</span>
            @else
              <a class="btn btn-ghost" href="{{ $users->previousPageUrl() }}">Prev</a>
            @endif
            <span class="muted">Page {{ $users->currentPage() }} of {{ $users->lastPage() }}</span>
            @if ($users->hasMorePages())
              <a class="btn btn-ghost" href="{{ $users->nextPageUrl() }}">Next</a>
            @else
              <span class="badge">Next</span>
            @endif
          </div>
        @endif
      @endif
    </div>
  </div>

  <script>
    const selectAll = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('.user-select');
    if (selectAll) {
      selectAll.addEventListener('change', (event) => {
        checkboxes.forEach((box) => {
          box.checked = event.target.checked;
        });
      });
    }

    document.querySelectorAll('.note-template').forEach((select) => {
      select.addEventListener('change', () => {
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
