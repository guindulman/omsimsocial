<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full scroll-smooth">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <title>@yield('title', 'Omsim')</title>
        <meta
            name="description"
            content="@yield('meta_description', 'Omsim is a private social app built for real connections, less noise, and verified friends.')"
        />

        <meta property="og:title" content="@yield('og_title', 'Omsim')" />
        <meta
            property="og:description"
            content="@yield('og_description', 'Real connections. Less noise. A private social app with verified friends.')"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="{{ url('/') }}" />
        <meta property="og:image" content="@yield('og_image', asset('assets/omsim-logo.png'))" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content="#1E40FF" />

        <script>
            (() => {
                // Apply theme early to avoid a flash. Tailwind `dark:` is class-based (see app.css).
                // Default to light unless the user explicitly chose dark.
                const stored = localStorage.getItem('theme');
                const theme = stored === 'dark' ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');
                document.documentElement.dataset.theme = theme;
            })();
        </script>

        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @endif

        @stack('head')
    </head>
    <body class="h-full bg-zinc-50 text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <a
            href="#main"
            class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-zinc-950 focus:shadow-lg focus:ring-2 focus:ring-[#1E40FF] dark:focus:bg-zinc-900 dark:focus:text-zinc-50"
        >
            Skip to content
        </a>

        @yield('content')
    </body>
</html>
