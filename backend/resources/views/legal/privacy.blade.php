@extends('layouts.app')

@section('title', 'Privacy - Omsim')
@section('meta_description', 'Omsim privacy policy.')

@section('content')
    <div class="relative">
        <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div class="absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#1E40FF]/10 blur-3xl"></div>
            <div class="absolute top-40 -right-32 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/10 blur-3xl"></div>
        </div>

        <header class="sticky top-0 z-50 border-b border-zinc-200/70 bg-zinc-50/75 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <div class="mx-auto max-w-6xl px-4 sm:px-6">
                <div class="flex items-center justify-between py-4">
                    <a href="{{ route('landing') }}" class="inline-flex items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950">
                        <img
                            src="{{ asset('assets/omsim-logo.png') }}"
                            alt="Omsim"
                            class="h-7 w-auto"
                            loading="eager"
                            decoding="async"
                        />
                    </a>

                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            data-theme-toggle
                            aria-pressed="false"
                            class="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950"
                        >
                            <span class="sr-only">Toggle theme</span>
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                <path d="M12 3v2M12 19v2M4.22 4.22l1.41 1.41M18.36 18.36l1.41 1.41M3 12h2M19 12h2M4.22 19.78l1.41-1.41M18.36 5.64l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                <path d="M12 17a5 5 0 100-10 5 5 0 000 10z" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </button>

                        <a
                            href="{{ route('contact.show') }}"
                            class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#1E40FF] via-violet-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#1E40FF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
                        >
                            Contact
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <main id="main">
            <div class="mx-auto max-w-3xl px-4 py-14 sm:px-6">
                <a
                    href="{{ route('landing') }}"
                    class="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-zinc-700 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
                >
                    <span aria-hidden="true">&larr;</span>
                    Back to Omsim
                </a>

                <h1 class="mt-6 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">Privacy</h1>
                <p class="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                    Last updated: February 8, 2026
                </p>

                <div class="mt-8">
                    @include('legal._privacy_body')
                </div>
            </div>

            @include('partials.site-footer')
        </main>
    </div>
@endsection
