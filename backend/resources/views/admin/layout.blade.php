<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $title ?? 'Omsim Admin' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script>
      (() => {
        // Default to light; respect a saved preference. Reuse the same key as the public site.
        const stored = localStorage.getItem('theme');
        const theme = stored === 'dark' ? 'dark' : 'light';
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.toggle('dark', theme === 'dark');
      })();
    </script>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f7fb;
        --surface: #ffffff;
        --surface-alt: #f1f3f8;
        --glass: rgba(255, 255, 255, 0.72);
        --text: #0b1220;
        --muted: rgba(11, 18, 32, 0.62);
        --accent: #1E40FF;
        --accent-2: #A855F7;
        --accent-3: #EC4899;
        --success: #16a34a;
        --warning: #d97706;
        --danger: #e11d48;
        --border: rgba(11, 18, 32, 0.12);
        --border-strong: rgba(11, 18, 32, 0.18);
        --shadow: rgba(15, 23, 42, 0.18);
        --radius: 20px;
        --radius-sm: 14px;
        --ring: rgba(30, 64, 255, 0.20);
        --ring-strong: rgba(30, 64, 255, 0.78);

        --bg-grad-1: rgba(30, 64, 255, 0.16);
        --bg-grad-2: rgba(168, 85, 247, 0.10);
        --bg-grad-3: rgba(236, 72, 153, 0.08);

        --sidebar-bg: rgba(255, 255, 255, 0.86);
        --sidebar-border: rgba(11, 18, 32, 0.08);
        --topbar-bg: rgba(246, 247, 251, 0.78);

        --soft-bg: rgba(11, 18, 32, 0.03);
        --soft-bg-hover: rgba(11, 18, 32, 0.06);

        --row-divider: rgba(11, 18, 32, 0.08);
        --row-hover: rgba(11, 18, 32, 0.03);

        --mobile-backdrop: rgba(11, 18, 32, 0.42);
        --mobile-panel-bg: rgba(255, 255, 255, 0.92);
        --mobile-panel-shadow: rgba(15, 23, 42, 0.20);
        --header-divider: rgba(11, 18, 32, 0.08);

        --nav-active-border: rgba(30, 64, 255, 0.35);
        --nav-active-bg: rgba(30, 64, 255, 0.10);
        --nav-active-text: rgba(11, 18, 32, 0.95);

        --pill-bg: rgba(30, 64, 255, 0.10);
        --pill-border: rgba(30, 64, 255, 0.24);
        --pill-text: rgba(11, 18, 32, 0.92);

        --danger-btn-bg: rgba(225, 29, 72, 0.10);
        --danger-btn-bg-hover: rgba(225, 29, 72, 0.14);
        --danger-btn-border: rgba(225, 29, 72, 0.28);
        --danger-btn-text: rgba(159, 18, 57, 0.95);

        --badge-ok-text: rgba(22, 101, 52, 0.95);
        --badge-warn-text: rgba(146, 64, 14, 0.95);
        --badge-danger-text: rgba(159, 18, 57, 0.95);
        --badge-accent-text: rgba(30, 64, 255, 0.95);
      }

      :root[data-theme="dark"] {
        color-scheme: dark;
        --bg: #070A12;
        --surface: #0d1327;
        --surface-alt: #090f1f;
        --glass: rgba(13, 19, 39, 0.82);
        --text: #f3f6ff;
        --muted: rgba(243, 246, 255, 0.62);
        --success: #22c55e;
        --warning: #f59e0b;
        --danger: #e11d48;
        --border: rgba(243, 246, 255, 0.12);
        --border-strong: rgba(243, 246, 255, 0.18);
        --shadow: rgba(0, 0, 0, 0.55);
        --ring: rgba(30, 64, 255, 0.26);
        --ring-strong: rgba(30, 64, 255, 0.92);

        --bg-grad-1: rgba(30, 64, 255, 0.35);
        --bg-grad-2: rgba(168, 85, 247, 0.22);
        --bg-grad-3: rgba(236, 72, 153, 0.16);

        --sidebar-bg: rgba(8, 11, 22, 0.92);
        --sidebar-border: rgba(243, 246, 255, 0.10);
        --topbar-bg: rgba(7, 10, 18, 0.72);

        --soft-bg: rgba(255, 255, 255, 0.03);
        --soft-bg-hover: rgba(255, 255, 255, 0.06);

        --row-divider: rgba(243, 246, 255, 0.08);
        --row-hover: rgba(255, 255, 255, 0.03);

        --mobile-backdrop: rgba(0, 0, 0, 0.55);
        --mobile-panel-bg: rgba(8, 11, 22, 0.92);
        --mobile-panel-shadow: rgba(0, 0, 0, 0.75);
        --header-divider: rgba(243, 246, 255, 0.10);

        --nav-active-border: rgba(30, 64, 255, 0.45);
        --nav-active-bg: rgba(30, 64, 255, 0.15);
        --nav-active-text: rgba(243, 246, 255, 0.92);

        --pill-bg: rgba(30, 64, 255, 0.14);
        --pill-border: rgba(30, 64, 255, 0.35);
        --pill-text: rgba(243, 246, 255, 0.92);

        --danger-btn-bg: rgba(225, 29, 72, 0.20);
        --danger-btn-bg-hover: rgba(225, 29, 72, 0.26);
        --danger-btn-border: rgba(225, 29, 72, 0.40);
        --danger-btn-text: rgba(254, 205, 211, 0.95);

        --badge-ok-text: rgba(187, 247, 208, 0.95);
        --badge-warn-text: rgba(254, 243, 199, 0.95);
        --badge-danger-text: rgba(254, 205, 211, 0.95);
        --badge-accent-text: rgba(219, 234, 254, 0.95);
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: "Poppins", sans-serif;
        color: var(--text);
        background:
          radial-gradient(circle at 8% 12%, var(--bg-grad-1), transparent 55%),
          radial-gradient(circle at 72% 10%, var(--bg-grad-2), transparent 50%),
          radial-gradient(circle at 100% 45%, var(--bg-grad-3), transparent 58%),
          var(--bg);
        min-height: 100vh;
        line-height: 1.45;
      }

      .shell {
        min-height: 100vh;
      }

      .shell--sidebar {
        display: grid;
        grid-template-columns: 260px minmax(0, 1fr);
      }

      a {
        color: inherit;
        text-decoration: none;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border-width: 0;
      }

      :focus-visible {
        outline: 2px solid var(--ring-strong);
        outline-offset: 2px;
      }

      .brand-logo-link {
        display: inline-flex;
        align-items: center;
        border-radius: 14px;
      }

      .brand-logo {
        height: 28px;
        width: auto;
        max-width: 190px;
        display: block;
      }

      .brand-logo--sidebar {
        height: 26px;
      }

      .brand-logo--topbar {
        height: 28px;
      }

      .page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        padding: 32px 24px;
        background: var(--sidebar-bg);
        border-right: 1px solid var(--sidebar-border);
        display: flex;
        flex-direction: column;
        gap: 28px;
        backdrop-filter: blur(18px);
      }

      .sidebar__brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .sidebar__brand small {
        display: block;
        color: var(--muted);
        font-size: 12px;
      }

      .sidebar__nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .nav-item {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid transparent;
        color: var(--muted);
        transition: all 0.2s ease;
      }

      .nav-item span {
        font-weight: 600;
        color: var(--text);
      }

      .nav-item.active,
      .nav-item:hover {
        border-color: var(--nav-active-border);
        background: var(--nav-active-bg);
        color: var(--nav-active-text);
      }

      .nav-item.active span {
        color: var(--nav-active-text);
      }

      .sidebar__footer {
        margin-top: auto;
        padding-top: 16px;
        border-top: 1px solid var(--border);
        font-size: 12px;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 24px 32px;
        border-bottom: 1px solid var(--border);
        background: var(--topbar-bg);
        backdrop-filter: blur(20px);
        position: sticky;
        top: 0;
        z-index: 5;
      }

      .topbar .brand {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .brand-mark {
        width: 44px;
        height: 44px;
        border-radius: 16px;
        background: linear-gradient(135deg, var(--accent), var(--accent-2), var(--accent-3));
        display: grid;
        place-items: center;
        font-weight: 700;
      }

      /* brand-text removed: logo-only admin header */

      .content {
        flex: 1;
        padding: 32px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        background: var(--pill-bg);
        border: 1px solid var(--pill-border);
        color: var(--pill-text);
      }

      .btn {
        border: 0;
        padding: 10px 16px;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
        font-size: 13px;
        transition: transform 0.08s ease, filter 0.18s ease, background 0.18s ease, border-color 0.18s ease;
      }

      .btn:hover {
        filter: brightness(1.08);
      }

      .btn:active {
        transform: translateY(1px);
      }

      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--accent), var(--accent-2), var(--accent-3));
        color: #fff;
      }

      .btn-ghost {
        background: var(--soft-bg);
        border: 1px solid var(--border);
        color: var(--text);
      }

      .btn-ghost:hover {
        background: var(--soft-bg-hover);
        border-color: var(--border-strong);
      }

      .btn-danger {
        background: var(--danger-btn-bg);
        color: var(--danger-btn-text);
        border: 1px solid var(--danger-btn-border);
      }

      .btn-danger:hover {
        background: var(--danger-btn-bg-hover);
      }

      .icon-btn {
        width: 42px;
        height: 42px;
        border-radius: 999px;
        border: 1px solid var(--border);
        background: var(--soft-bg);
        color: var(--text);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.18s ease, border-color 0.18s ease;
      }

      .icon-btn:hover {
        background: var(--soft-bg-hover);
        border-color: var(--border-strong);
      }

      .icon-btn--menu {
        display: none;
      }

      .theme-icon {
        width: 18px;
        height: 18px;
      }

      .theme-icon--sun {
        display: none;
      }

      :root[data-theme="dark"] .theme-icon--sun {
        display: block;
      }

      :root[data-theme="dark"] .theme-icon--moon {
        display: none;
      }

      .grid {
        display: grid;
        gap: 20px;
      }

      .card {
        background: var(--glass);
        border-radius: var(--radius);
        border: 1px solid var(--border);
        padding: 20px;
        box-shadow: 0 20px 40px -30px var(--shadow);
        backdrop-filter: blur(16px);
        overflow: hidden;
      }

      .card.glow {
        background: linear-gradient(135deg, rgba(30, 64, 255, 0.18), rgba(236, 72, 153, 0.10));
        border-color: rgba(30, 64, 255, 0.30);
      }

      .card h3 {
        font-size: 16px;
        margin-bottom: 12px;
      }

      .stat-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }

      .stat {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .stat h4 {
        font-size: 24px;
      }

      .stat span {
        color: var(--muted);
        font-size: 12px;
      }

      .health-grid {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }

      .health-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 14px;
        background: var(--soft-bg);
        border: 1px solid var(--border);
      }

      .health-item .status {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--muted);
      }

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--success);
        display: inline-block;
      }

      .dot.warn {
        background: var(--warning);
      }

      .dot.danger {
        background: var(--danger);
      }

      .table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .table th,
      .table td {
        padding: 10px 12px;
        border-bottom: 1px solid var(--row-divider);
        text-align: left;
        vertical-align: top;
      }

      .table th {
        color: var(--muted);
        font-weight: 500;
      }

      .table tbody tr:hover td {
        background: var(--row-hover);
      }

      .badge {
        display: inline-flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 11px;
        border: 1px solid var(--border);
        color: var(--muted);
      }

      .badge--ok {
        border-color: rgba(34, 197, 94, 0.35);
        background: rgba(34, 197, 94, 0.12);
        color: var(--badge-ok-text);
      }

      .badge--warn {
        border-color: rgba(245, 158, 11, 0.45);
        background: rgba(245, 158, 11, 0.12);
        color: var(--badge-warn-text);
      }

      .badge--danger {
        border-color: rgba(225, 29, 72, 0.45);
        background: rgba(225, 29, 72, 0.12);
        color: var(--badge-danger-text);
      }

      .badge--accent {
        border-color: rgba(30, 64, 255, 0.45);
        background: rgba(30, 64, 255, 0.12);
        color: var(--badge-accent-text);
      }

      .split {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
        gap: 24px;
      }

      .actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .muted {
        color: var(--muted);
        font-size: 12px;
      }

      .empty {
        color: var(--muted);
        font-size: 13px;
        padding: 12px 0;
      }

      .mobile-nav {
        position: fixed;
        inset: 0;
        z-index: 60;
        padding: 14px;
        display: grid;
        place-items: start end;
      }

      .mobile-nav[hidden] {
        display: none;
      }

      .mobile-nav__backdrop {
        position: absolute;
        inset: 0;
        background: var(--mobile-backdrop);
        backdrop-filter: blur(10px);
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .mobile-nav__panel {
        position: relative;
        width: min(92vw, 360px);
        border-radius: 22px;
        border: 1px solid var(--border-strong);
        background: var(--mobile-panel-bg);
        box-shadow: 0 24px 60px -24px var(--mobile-panel-shadow);
        transform: translateY(-8px);
        opacity: 0;
        transition: transform 0.2s ease, opacity 0.2s ease;
        overflow: hidden;
      }

      .mobile-nav.is-open .mobile-nav__backdrop {
        opacity: 1;
      }

      .mobile-nav.is-open .mobile-nav__panel {
        opacity: 1;
        transform: translateY(0);
      }

      .mobile-nav__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px;
        border-bottom: 1px solid var(--header-divider);
      }

      .mobile-nav__links {
        padding: 10px;
        display: grid;
        gap: 8px;
      }

      @media (prefers-reduced-motion: reduce) {
        * {
          transition: none !important;
        }
      }

      @media (max-width: 960px) {
        .shell--sidebar {
          grid-template-columns: 1fr;
        }

        .sidebar {
          display: none;
        }

        .icon-btn--menu {
          display: inline-flex;
        }

        .topbar {
          padding: 16px 18px;
        }

        .split {
          grid-template-columns: 1fr;
        }

        .content {
          padding: 24px;
        }

        .table {
          display: block;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: calc(var(--radius) - 6px);
        }
      }
    </style>
  </head>
  <body>
    @php($withSidebar = $withSidebar ?? false)
    <div class="shell {{ $withSidebar ? 'shell--sidebar' : '' }}">
      @if ($withSidebar)
        <aside class="sidebar">
          <div class="sidebar__brand">
            <a href="{{ route('admin.dashboard') }}" class="brand-logo-link">
              <img
                src="{{ asset('assets/omsim-logo.png') }}"
                alt="Omsim"
                class="brand-logo brand-logo--sidebar"
                loading="eager"
                decoding="async"
              />
            </a>
          </div>
          <nav class="sidebar__nav">
            <a
              href="{{ route('admin.dashboard') }}"
              class="nav-item {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}"
              @if (request()->routeIs('admin.dashboard')) aria-current="page" @endif
            >
              <span>Dashboard</span>
              <small>Live ops</small>
            </a>
            <a
              href="{{ route('admin.users') }}"
              class="nav-item {{ request()->routeIs('admin.users*') ? 'active' : '' }}"
              @if (request()->routeIs('admin.users*')) aria-current="page" @endif
            >
              <span>Users</span>
              <small>Moderation</small>
            </a>
            <a
              href="{{ route('admin.reports') }}"
              class="nav-item {{ request()->routeIs('admin.reports') ? 'active' : '' }}"
              @if (request()->routeIs('admin.reports')) aria-current="page" @endif
            >
              <span>Reports</span>
              <small>Queue</small>
            </a>
            <a
              href="{{ route('admin.audit') }}"
              class="nav-item {{ request()->routeIs('admin.audit') ? 'active' : '' }}"
              @if (request()->routeIs('admin.audit')) aria-current="page" @endif
            >
              <span>Audit log</span>
              <small>History</small>
            </a>
          </nav>
          <div class="sidebar__footer">
            <span class="muted">Secure access</span>
          </div>
        </aside>
      @endif
      <div class="page">
        @yield('content')
      </div>
    </div>

    @if ($withSidebar)
      <div id="admin-mobile-nav" class="mobile-nav" data-admin-mobile-nav hidden>
        <div class="mobile-nav__backdrop" data-admin-mobile-nav-close></div>
        <div class="mobile-nav__panel" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <div class="mobile-nav__header">
            <div class="sidebar__brand">
              <a href="{{ route('admin.dashboard') }}" class="brand-logo-link">
                <img
                  src="{{ asset('assets/omsim-logo.png') }}"
                  alt="Omsim"
                  class="brand-logo brand-logo--sidebar"
                  loading="eager"
                  decoding="async"
                />
              </a>
            </div>
            <button type="button" class="icon-btn" data-admin-mobile-nav-close>
              <span class="sr-only">Close menu</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <nav class="mobile-nav__links" aria-label="Admin">
            <a
              href="{{ route('admin.dashboard') }}"
              class="nav-item {{ request()->routeIs('admin.dashboard') ? 'active' : '' }}"
              @if (request()->routeIs('admin.dashboard')) aria-current="page" @endif
              data-admin-mobile-nav-link
            >
              <span>Dashboard</span>
              <small>Live ops</small>
            </a>
            <a
              href="{{ route('admin.users') }}"
              class="nav-item {{ request()->routeIs('admin.users*') ? 'active' : '' }}"
              @if (request()->routeIs('admin.users*')) aria-current="page" @endif
              data-admin-mobile-nav-link
            >
              <span>Users</span>
              <small>Moderation</small>
            </a>
            <a
              href="{{ route('admin.reports') }}"
              class="nav-item {{ request()->routeIs('admin.reports') ? 'active' : '' }}"
              @if (request()->routeIs('admin.reports')) aria-current="page" @endif
              data-admin-mobile-nav-link
            >
              <span>Reports</span>
              <small>Queue</small>
            </a>
            <a
              href="{{ route('admin.audit') }}"
              class="nav-item {{ request()->routeIs('admin.audit') ? 'active' : '' }}"
              @if (request()->routeIs('admin.audit')) aria-current="page" @endif
              data-admin-mobile-nav-link
            >
              <span>Audit log</span>
              <small>History</small>
            </a>
          </nav>
        </div>
      </div>

      <script>
        (() => {
          const nav = document.querySelector('[data-admin-mobile-nav]');
          if (!nav) return;

          const triggers = Array.from(document.querySelectorAll('[data-admin-mobile-nav-trigger]'));
          const closeButtons = Array.from(nav.querySelectorAll('[data-admin-mobile-nav-close]'));
          const closeOnLinks = Array.from(nav.querySelectorAll('[data-admin-mobile-nav-link]'));

          let lastActive = null;

          const setExpanded = (expanded) => {
            triggers.forEach((btn) => btn.setAttribute('aria-expanded', expanded ? 'true' : 'false'));
          };

          const open = () => {
            if (!nav.hidden) return;
            lastActive = document.activeElement;
            nav.hidden = false;
            document.body.style.overflow = 'hidden';
            setExpanded(true);
            requestAnimationFrame(() => {
              nav.classList.add('is-open');
              const firstLink = nav.querySelector('a');
              if (firstLink) firstLink.focus();
            });
          };

          const close = () => {
            if (nav.hidden) return;
            nav.classList.remove('is-open');
            document.body.style.overflow = '';
            setExpanded(false);
            window.setTimeout(() => {
              nav.hidden = true;
              if (lastActive instanceof HTMLElement) lastActive.focus();
            }, 180);
          };

          triggers.forEach((btn) => {
            btn.addEventListener('click', open);
          });
          closeButtons.forEach((btn) => {
            btn.addEventListener('click', close);
          });
          closeOnLinks.forEach((link) => {
            link.addEventListener('click', close);
          });
          document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') close();
          });
        })();
      </script>
    @endif

    <script>
      (() => {
        const toggles = Array.from(document.querySelectorAll('[data-admin-theme-toggle]'));
        if (toggles.length === 0) return;

        const getTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
        const sync = () => {
          const theme = getTheme();
          toggles.forEach((btn) => {
            if (!(btn instanceof HTMLElement)) return;
            btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
          });
        };
        const setTheme = (next) => {
          const theme = next === 'dark' ? 'dark' : 'light';
          document.documentElement.dataset.theme = theme;
          document.documentElement.classList.toggle('dark', theme === 'dark');
          localStorage.setItem('theme', theme);
          sync();
        };

        toggles.forEach((btn) => {
          btn.addEventListener('click', () => {
            setTheme(getTheme() === 'dark' ? 'light' : 'dark');
          });
        });

        sync();
      })();
    </script>
  </body>
</html>
