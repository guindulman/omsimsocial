@extends('layouts.app')

@section('title', 'Omsim - Real Friends. Less Noise.')
@section('meta_description', 'Friends over followers. Omsim is a private social app with verified friends, built for real life.')
@section('og_title', 'Omsim')
@section('og_description', 'Real Friends. Less Noise. A private social app with verified friends.')

@section('content')
    <div class="relative">
        <div aria-hidden="true" class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div class="absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-[#1E40FF]/10 blur-3xl"></div>
            <div class="absolute top-40 -right-32 h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/10 blur-3xl"></div>
            <div class="absolute -bottom-48 -left-40 h-[30rem] w-[30rem] rounded-full bg-violet-500/10 blur-3xl"></div>
        </div>

        <!-- 1) Sticky Navbar -->
        <header class="sticky top-0 z-50 border-b border-zinc-200/70 bg-zinc-50/75 backdrop-blur dark:border-white/10 dark:bg-zinc-950/70">
            <div class="mx-auto max-w-6xl px-4 sm:px-6">
                <div class="flex items-center justify-between py-4">
                    <a
                        href="{{ route('landing') }}"
                        class="inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
                    >
                        <img
                            src="{{ asset('assets/omsim-logo.png') }}"
                            alt="Omsim"
                            class="h-7 w-auto"
                            loading="eager"
                            decoding="async"
                        />
                    </a>

                    <nav aria-label="Primary" class="hidden items-center gap-1 text-sm font-semibold md:flex">
                        <a
                            href="#features"
                            class="rounded-xl px-3 py-2 text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            class="rounded-xl px-3 py-2 text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
                        >
                            How it Works
                        </a>
                        <a
                            href="#privacy"
                            class="rounded-xl px-3 py-2 text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
                        >
                            Privacy
                        </a>
                        <a
                            href="#faq"
                            class="rounded-xl px-3 py-2 text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
                        >
                            FAQ
                        </a>
                    </nav>

                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            data-theme-toggle
                            aria-pressed="false"
                            class="hidden items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950 sm:inline-flex"
                        >
                            <span class="sr-only">Toggle theme</span>
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                <path d="M12 3v2M12 19v2M4.22 4.22l1.41 1.41M18.36 18.36l1.41 1.41M3 12h2M19 12h2M4.22 19.78l1.41-1.41M18.36 5.64l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                <path d="M12 17a5 5 0 100-10 5 5 0 000 10z" stroke="currentColor" stroke-width="2" />
                            </svg>
                        </button>

                        <a
                            href="#download"
                            class="hidden items-center justify-center rounded-full bg-gradient-to-r from-[#1E40FF] via-violet-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#1E40FF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 md:inline-flex sm:px-5"
                        >
                            Download
                        </a>

                        <a
                            href="#download"
                            class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#1E40FF] via-violet-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#1E40FF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 md:hidden"
                        >
                            Download
                        </a>

                        <button
                            type="button"
                            data-mobile-menu-trigger
                            aria-controls="mobile-menu"
                            aria-expanded="false"
                            class="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950 md:hidden"
                        >
                            <span class="sr-only">Open menu</span>
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div
                    id="mobile-menu"
                    data-mobile-menu
                    hidden
                    class="origin-top rounded-2xl border border-zinc-200/70 bg-white/90 p-2 shadow-lg shadow-zinc-950/10 backdrop-blur transition duration-200 opacity-0 -translate-y-2 pointer-events-none dark:border-white/10 dark:bg-zinc-950/80 md:hidden"
                >
                    <div class="flex items-center justify-between px-2 pb-2 pt-1">
                        <div class="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Navigate</div>
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
                    </div>

                    <nav aria-label="Mobile" class="grid gap-1 p-1 text-sm font-semibold">
                        <a
                            href="#features"
                            class="rounded-xl px-3 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            class="rounded-xl px-3 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
                        >
                            How it Works
                        </a>
                        <a
                            href="#privacy"
                            class="rounded-xl px-3 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
                        >
                            Privacy
                        </a>
                        <a
                            href="#faq"
                            class="rounded-xl px-3 py-3 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-zinc-200 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
                        >
                            FAQ
                        </a>
                    </nav>
                </div>
            </div>
        </header>

        <main id="main">
            <!-- 2) Hero (Momento-style premium) -->
            <section class="relative py-12 sm:py-16 lg:py-20">
                <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
                    <div>
                        <div class="inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                            <span aria-hidden="true" class="inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-[#1E40FF] via-violet-500 to-pink-500"></span>
                            Verified friends, private by default
                        </div>

                        <h1 class="mt-5 text-balance text-4xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-5xl">
                            Real Friends. Less Noise.
                        </h1>
                        <p class="mt-4 max-w-xl text-pretty text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                            Friends over followers. A private social app with verified friends.
                        </p>

                        <div class="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <a
                                href="#download"
                                class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#1E40FF] via-violet-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#1E40FF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
                            >
                                Download
                            </a>
                            <a
                                href="#features"
                                class="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950"
                            >
                                See Features
                            </a>
                        </div>

                        <div class="mt-6 flex flex-wrap items-center gap-2">
                            <span class="inline-flex items-center rounded-full border border-zinc-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                                Private by default
                            </span>
                            <span class="inline-flex items-center rounded-full border border-zinc-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                                No follower pressure
                            </span>
                            <span class="inline-flex items-center rounded-full border border-zinc-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                                Fast &amp; lightweight
                            </span>
                        </div>
                    </div>

                    <div class="relative mx-auto w-fit max-w-full">
                        <div aria-hidden="true" class="absolute inset-0 -z-10 rounded-[2.75rem] bg-gradient-to-br from-violet-500/20 via-transparent to-fuchsia-500/20 blur-2xl"></div>

                        <div
                            class="relative inline-block aspect-[9/19] overflow-hidden rounded-[2.75rem] border border-zinc-200 bg-white shadow-2xl shadow-zinc-950/10 dark:border-white/10 dark:bg-zinc-900/40"
                            style="height: min(76vh, 860px); max-height: calc(100vh - 180px);"
                        >
                            <div class="absolute left-1/2 top-3 h-1.5 w-24 -translate-x-1/2 rounded-full bg-zinc-200 dark:bg-white/10"></div>

                            <div class="h-full p-5 sm:p-6">
                                @php
                                    $heroVideoMp4 = file_exists(public_path('assets/Mobile-preview.mp4'))
                                        ? asset('assets/Mobile-preview.mp4')
                                        : null;
                                    $heroVideoWebm = file_exists(public_path('assets/Mobile-preview.webm'))
                                        ? asset('assets/Mobile-preview.webm')
                                        : null;
                                    $heroVideoMpg = file_exists(public_path('assets/Mobile-preview.mpg'))
                                        ? asset('assets/Mobile-preview.mpg')
                                        : null;

                                    $previewAvif = file_exists(public_path('assets/app-preview.avif'))
                                        ? asset('assets/app-preview.avif')
                                        : null;
                                    $previewWebp = file_exists(public_path('assets/app-preview.webp'))
                                        ? asset('assets/app-preview.webp')
                                        : null;
                                    $previewPng = file_exists(public_path('assets/app-preview.png'))
                                        ? asset('assets/app-preview.png')
                                        : null;
                                    $previewJpg = file_exists(public_path('assets/app-preview.jpg'))
                                        ? asset('assets/app-preview.jpg')
                                        : null;

                                    $previewSrc = $previewPng ?? $previewJpg ?? $previewWebp ?? $previewAvif;
                                @endphp

                                @if ($heroVideoMp4 || $heroVideoWebm || $heroVideoMpg)
                                    <div class="relative h-full overflow-hidden rounded-[2.1rem] bg-zinc-50 shadow-inner ring-1 ring-zinc-200/70 dark:bg-zinc-950/40 dark:ring-white/10">
                                        <div
                                            aria-hidden="true"
                                            class="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#1E40FF]/10 via-zinc-50 to-pink-500/10 dark:from-[#1E40FF]/15 dark:via-zinc-950/20 dark:to-pink-500/15"
                                        ></div>
                                        <video
                                            data-hero-preview-video
                                            class="relative h-full w-full object-cover"
                                            autoplay
                                            loop
                                            muted
                                            playsinline
                                            webkit-playsinline
                                            preload="metadata"
                                        >
                                            @if ($heroVideoWebm)
                                                <source src="{{ $heroVideoWebm }}" type="video/webm" />
                                            @endif
                                            @if ($heroVideoMp4)
                                                <source src="{{ $heroVideoMp4 }}" type="video/mp4" />
                                            @endif
                                            @if ($heroVideoMpg)
                                                <source src="{{ $heroVideoMpg }}" type="video/mpeg" />
                                            @endif
                                        </video>
                                    </div>
                                @elseif ($previewSrc)
                                    <div class="h-full overflow-hidden rounded-[2.1rem] bg-zinc-50 shadow-inner ring-1 ring-zinc-200/70 dark:bg-zinc-950/40 dark:ring-white/10">
                                        <picture>
                                            @if ($previewAvif)
                                                <source type="image/avif" srcset="{{ $previewAvif }}" />
                                            @endif
                                            @if ($previewWebp)
                                                <source type="image/webp" srcset="{{ $previewWebp }}" />
                                            @endif
                                            <img
                                                src="{{ $previewSrc }}"
                                                alt="Omsim app UI preview"
                                                class="h-full w-full object-cover"
                                                loading="eager"
                                                decoding="async"
                                                fetchpriority="high"
                                            />
                                        </picture>
                                    </div>
                                @else
                                    <div aria-hidden="true" class="h-full rounded-[2.1rem] bg-zinc-50 p-4 shadow-inner ring-1 ring-zinc-200/70 dark:bg-zinc-950/40 dark:ring-white/10">
                                        <div class="flex items-center justify-between">
                                            <div class="flex items-center gap-2">
                                                <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70 dark:bg-white/5 dark:ring-white/10">
                                                    <span class="h-3 w-3 rounded-full bg-[#1E40FF]"></span>
                                                </span>
                                                <div class="text-sm font-semibold text-zinc-950 dark:text-white">Omsim</div>
                                            </div>
                                            <div class="h-9 w-9 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70 dark:bg-white/5 dark:ring-white/10"></div>
                                        </div>

                                        <!-- Story rings -->
                                        <div class="mt-4 flex gap-3 overflow-hidden">
                                            @foreach ([1, 2, 3, 4, 5] as $i)
                                                <div class="shrink-0">
                                                    <div class="h-12 w-12 rounded-full bg-gradient-to-tr from-[#1E40FF] via-violet-500 to-pink-500 p-[2px] shadow-sm">
                                                        <div class="h-full w-full rounded-full bg-zinc-50 ring-1 ring-zinc-200/70 dark:bg-zinc-950/40 dark:ring-white/10"></div>
                                                    </div>
                                                    <div class="mt-1 h-2 w-12 rounded-full bg-zinc-200/70 dark:bg-white/10"></div>
                                                </div>
                                            @endforeach
                                        </div>

                                        <!-- Feed cards -->
                                        <div class="mt-4 grid gap-3">
                                            <div class="rounded-3xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
                                                <div class="flex items-start gap-3">
                                                    <div class="h-10 w-10 rounded-full bg-gradient-to-tr from-[#1E40FF]/35 via-violet-500/25 to-pink-500/30 p-[2px]">
                                                        <div class="h-full w-full rounded-full bg-zinc-100 dark:bg-zinc-950/60"></div>
                                                    </div>
                                                    <div class="flex-1">
                                                        <div class="h-3 w-24 rounded-full bg-zinc-200 dark:bg-white/10"></div>
                                                        <div class="mt-2 h-2.5 w-full rounded-full bg-zinc-200/80 dark:bg-white/10"></div>
                                                        <div class="mt-1.5 h-2.5 w-5/6 rounded-full bg-zinc-200/70 dark:bg-white/10"></div>
                                                    </div>
                                                </div>
                                                <div class="mt-3 h-28 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1E40FF]/10 via-zinc-50 to-pink-500/10 ring-1 ring-zinc-200/70 dark:from-[#1E40FF]/15 dark:via-zinc-950/20 dark:to-pink-500/15 dark:ring-white/10"></div>
                                            </div>

                                            <div class="rounded-3xl border border-zinc-200/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900/50">
                                                <div class="flex items-start gap-3">
                                                    <div class="h-10 w-10 rounded-full bg-gradient-to-tr from-[#1E40FF]/35 via-violet-500/25 to-pink-500/30 p-[2px]">
                                                        <div class="h-full w-full rounded-full bg-zinc-100 dark:bg-zinc-950/60"></div>
                                                    </div>
                                                    <div class="flex-1">
                                                        <div class="h-3 w-20 rounded-full bg-zinc-200 dark:bg-white/10"></div>
                                                        <div class="mt-2 h-2.5 w-11/12 rounded-full bg-zinc-200/80 dark:bg-white/10"></div>
                                                        <div class="mt-1.5 h-2.5 w-2/3 rounded-full bg-zinc-200/70 dark:bg-white/10"></div>
                                                    </div>
                                                </div>
                                                <div class="mt-3 flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-200">
                                                    <span>Friends-only</span>
                                                    <span class="text-zinc-500 dark:text-zinc-400">Verified adds</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="mt-4 h-10 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70 dark:bg-white/5 dark:ring-white/10"></div>
                                    </div>
                                @endif
                            </div>
                        </div>
                        <p class="mt-3 text-center text-xs text-zinc-500 dark:text-zinc-400">
                            @if ($heroVideoMp4 || $heroVideoWebm || $heroVideoMpg)
                                In-app video preview.
                            @elseif ($previewSrc)
                                In-app screenshot preview.
                            @else
                                Phone preview mock. Original UI shapes, no external assets.
                            @endif
                        </p>
                    </div>
                </div>
            </section>

            <!-- 3) Feature Grid -->
            <section id="features" class="scroll-mt-24 py-16 sm:py-20 lg:py-24">
                <div class="mx-auto max-w-6xl px-4 sm:px-6">
                    <div class="max-w-2xl">
                        <h2 class="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                            Built for real people, not algorithms
                        </h2>
                        <p class="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                            A clean, modern social experience focused on real friends.
                        </p>
                    </div>

                    @php
                        $features = [
                            [
                                'title' => 'Verified Friends',
                                'desc' => 'Verify friends in person via handshake or QR.',
                                'icon' => 'handshake',
                            ],
                            [
                                'title' => 'Friends',
                                'desc' => 'Keep your list real, not inflated.',
                                'icon' => 'friends',
                            ],
                            [
                                'title' => 'Posts',
                                'desc' => 'Share simple updates without the noise.',
                                'icon' => 'posts',
                            ],
                            [
                                'title' => 'Safety & Privacy',
                                'desc' => 'Private by default with clear controls.',
                                'icon' => 'lock',
                            ],
                            [
                                'title' => 'No Follower Chasing',
                                'desc' => 'Followers are optional, and visibility can be private.',
                                'icon' => 'clean',
                            ],
                            [
                                'title' => 'Lightweight & Fast',
                                'desc' => 'Quick load, minimal clutter, calm UX.',
                                'icon' => 'spark',
                            ],
                        ];
                    @endphp

                    <div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        @foreach ($features as $feature)
                            <div class="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-white/10 dark:bg-zinc-900/40">
                                <div class="flex items-center gap-4">
                                    <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E40FF]/10 text-[#1E40FF] ring-1 ring-[#1E40FF]/20 dark:bg-[#1E40FF]/15">
                                        <span class="sr-only">{{ $feature['title'] }}</span>

                                        @if ($feature['icon'] === 'handshake')
                                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                                <path d="M7.5 13.5l2.5 2.5c1 1 2.6 1 3.6 0l4.9-4.9c1-1 1-2.6 0-3.6l-1.2-1.2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M6 12l2-2c1.6-1.6 4.2-1.6 5.8 0l.4.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.7" />
                                                <path d="M4 14l2.5-2.5M20 10l-2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6" />
                                            </svg>
                                        @elseif ($feature['icon'] === 'friends')
                                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                                <path d="M8 12a4 4 0 118 0 4 4 0 01-8 0z" stroke="currentColor" stroke-width="2" />
                                                <path d="M4 20c1.8-2.2 4.3-3.5 8-3.5S18.2 17.8 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.75" />
                                            </svg>
                                        @elseif ($feature['icon'] === 'posts')
                                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                                <path d="M7 7h10M7 11h10M7 15h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                                <path d="M6 3h12a2 2 0 012 2v14l-4-2H6a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" opacity="0.75" />
                                            </svg>
                                        @elseif ($feature['icon'] === 'clean')
                                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                                <path d="M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                                <path d="M6 8h12M8 16h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.7" />
                                                <path d="M5 5l14 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6" />
                                            </svg>
                                        @elseif ($feature['icon'] === 'pulse')
                                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                                <path d="M3 12h4l2-5 3 10 2-5h7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                                <path d="M12 4v2m0 12v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity="0.6" />
                                            </svg>
                                        @elseif ($feature['icon'] === 'lock')
                                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                                <path d="M7 10V8a5 5 0 0110 0v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                                <path d="M6 10h12v10H6V10z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                                            </svg>
                                        @else
                                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                                <path d="M12 2l1.8 7.2L21 12l-7.2 2.8L12 22l-1.8-7.2L3 12l7.2-2.8L12 2z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                                            </svg>
                                        @endif
                                    </div>
                                    <div>
                                        <div class="text-sm font-semibold text-zinc-950 dark:text-white">{{ $feature['title'] }}</div>
                                        <div class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{{ $feature['desc'] }}</div>
                                    </div>
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
            </section>

            <!-- 4) How It Works -->
            <section id="how-it-works" class="scroll-mt-24 py-16 sm:py-20 lg:py-24">
                <div class="mx-auto max-w-6xl px-4 sm:px-6">
                    <div class="max-w-2xl">
                        <h2 class="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                            How it works
                        </h2>
                        <p class="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                            Three steps. Simple by design.
                        </p>
                    </div>

                    <div class="relative mt-10 grid gap-4 md:grid-cols-3">
                        <div
                            aria-hidden="true"
                            class="absolute left-6 right-6 top-6 hidden h-px bg-gradient-to-r from-violet-500/35 via-[#1E40FF]/35 to-pink-500/35 dark:from-violet-500/25 dark:via-[#1E40FF]/25 dark:to-pink-500/25 md:block"
                        ></div>

                        <div class="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                            <div class="flex items-start gap-4">
                                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E40FF] text-sm font-semibold text-white ring-4 ring-[#1E40FF]/15">
                                    1
                                </div>
                                <div>
                                    <div class="text-sm font-semibold text-zinc-950 dark:text-white">Handshake / QR connect</div>
                                    <p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                                        Connect with people you actually know, in person.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                            <div class="flex items-start gap-4">
                                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E40FF] text-sm font-semibold text-white ring-4 ring-[#1E40FF]/15">
                                    2
                                </div>
                                <div>
                                    <div class="text-sm font-semibold text-zinc-950 dark:text-white">Post</div>
                                    <p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                                        Share an update. Keep it simple and personal.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="rounded-2xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                            <div class="flex items-start gap-4">
                                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E40FF] text-sm font-semibold text-white ring-4 ring-[#1E40FF]/15">
                                    3
                                </div>
                                <div>
                                    <div class="text-sm font-semibold text-zinc-950 dark:text-white">Keep it real</div>
                                    <p class="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                                        Share with intent, and keep the feed calm.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 5) Proof / Metrics Strip -->
            <section class="py-12">
                <div class="mx-auto max-w-6xl px-4 sm:px-6">
                    <div class="rounded-2xl border border-zinc-200/70 bg-white/70 px-6 py-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <div class="text-sm font-semibold text-zinc-950 dark:text-white">&lt; 1 min setup</div>
                                <div class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Add a friend and you're in.</div>
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-zinc-950 dark:text-white">No spam feed</div>
                                <div class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">No endless noise.</div>
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-zinc-950 dark:text-white">Verified-friends design</div>
                                <div class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Add people you know in real life.</div>
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-zinc-950 dark:text-white">Built for real life</div>
                                <div class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Fast and lightweight.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 6) Privacy Section -->
            <section id="privacy" class="scroll-mt-24 py-16 sm:py-20 lg:py-24">
                <div class="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2">
                    <div>
                        <h2 class="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                            Privacy that makes sense
                        </h2>
                        <p class="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                            Omsim is built to protect your real relationships, not maximize engagement.
                        </p>
                        <ul class="mt-6 grid gap-3 text-sm text-zinc-700 dark:text-zinc-200">
                            <li class="flex gap-3">
                                <span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-300">
                                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                                        <path d="M7 13l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                </span>
                                <span class="font-semibold text-zinc-950 dark:text-white">Private by default</span>
                            </li>
                            <li class="flex gap-3">
                                <span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-300">
                                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                                        <path d="M7 13l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                </span>
                                <span class="font-semibold text-zinc-950 dark:text-white">Followers can be private</span>
                            </li>
                            <li class="flex gap-3">
                                <span class="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-300">
                                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-4 w-4">
                                        <path d="M7 13l3 3 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                    </svg>
                                </span>
                                <span class="font-semibold text-zinc-950 dark:text-white">Control who sees what</span>
                            </li>
                        </ul>
                    </div>

                    <div class="relative">
                        <div aria-hidden="true" class="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-[#1E40FF]/10 via-transparent to-fuchsia-500/10 blur-2xl"></div>
                        <div class="rounded-3xl border border-zinc-200/70 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900/40">
                            <div class="flex items-center gap-4">
                                <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E40FF]/10 text-[#1E40FF] ring-1 ring-[#1E40FF]/20 dark:bg-[#1E40FF]/15">
                                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-7 w-7">
                                        <path d="M7 10V8a5 5 0 0110 0v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                                        <path d="M6 10h12v10H6V10z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <div class="text-sm font-semibold text-zinc-950 dark:text-white">Lock icon, real control</div>
                                    <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                                        You decide what is public, what is friends-only, and what stays private.
                                    </p>
                                </div>
                            </div>
                            <div class="mt-6 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-5 text-sm text-zinc-700 dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-200">
                                <div class="font-semibold text-zinc-950 dark:text-white">Our promise</div>
                                <p class="mt-2 leading-relaxed text-zinc-600 dark:text-zinc-300">
                                    A feed built for friends.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 7) FAQ -->
            <section id="faq" class="scroll-mt-24 py-16 sm:py-20 lg:py-24">
                <div class="mx-auto max-w-6xl px-4 sm:px-6">
                    <div class="max-w-2xl">
                        <h2 class="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                            FAQ
                        </h2>
                        <p class="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                            Quick answers. No fine print.
                        </p>
                    </div>

                    <div class="mt-10 divide-y divide-zinc-200/70 rounded-2xl border border-zinc-200/70 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-zinc-900/40">
                        @php
                            $faqs = [
                                [
                                    'q' => 'Is it free?',
                                    'a' => 'Yes. We plan to keep core features free, with optional upgrades later.',
                                ],
                                [
                                    'q' => 'Can I post publicly?',
                                    'a' => 'Yes. You can share publicly, or keep posts friends-only. You choose every time.',
                                ],
                                [
                                    'q' => 'How do friends work?',
                                    'a' => 'Friends start with verified adds: scan a QR in person (or share a short code) so you know who you add.',
                                ],
                                [
                                    'q' => 'Do I have to meet in person to add someone?',
                                    'a' => 'For verified adds, yes. The goal is to keep your friends list real and reduce spam.',
                                ],
                                [
                                    'q' => 'What do you mean by verified friends?',
                                    'a' => 'Verified friends are added through an in-person handshake or QR scan, so you can trust who you connect with.',
                                ],
                                [
                                    'q' => 'Do you sell my data?',
                                    'a' => "No. We don't sell your data like other social media.",
                                ],
                                [
                                    'q' => 'Do you collect my data?',
                                    'a' => "We collect what we need to run Omsim (like your username and, if you add them, your email or phone for sign-in) plus what you choose to share. We don't sell your personal data, and we don't share your phone number with advertisers.",
                                ],
                            ];
                        @endphp

                        @foreach ($faqs as $index => $item)
                            @php
                                $btnId = 'faq-btn-' . ($index + 1);
                                $panelId = 'faq-panel-' . ($index + 1);
                            @endphp
                            <div class="p-2">
                                <button
                                    type="button"
                                    data-accordion-trigger
                                    id="{{ $btnId }}"
                                    aria-expanded="false"
                                    aria-controls="{{ $panelId }}"
                                    class="flex w-full items-center justify-between gap-4 rounded-xl px-4 py-4 text-left text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-white dark:hover:bg-white/5 dark:focus-visible:ring-offset-zinc-950"
                                >
                                    <span>{{ $item['q'] }}</span>
                                    <span class="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 shadow-sm dark:border-white/10 dark:bg-zinc-900/60 dark:text-zinc-200">
                                        <svg data-accordion-icon aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5 transition-transform duration-200">
                                            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                        </svg>
                                    </span>
                                </button>
                                <div
                                    id="{{ $panelId }}"
                                    role="region"
                                    aria-labelledby="{{ $btnId }}"
                                    hidden
                                    class="px-4 pb-5 pt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
                                >
                                    {{ $item['a'] }}
                                </div>
                            </div>
                        @endforeach
                    </div>
                </div>
            </section>

            <!-- 8) Download -->
            <section id="download" class="scroll-mt-24 pb-20 pt-6 sm:pb-24">
                @php
                    $iosUrl = config('services.stores.ios_app_store_url');
                    $androidUrl = config('services.stores.android_play_store_url');
                    $hasIos = ! empty($iosUrl);
                    $hasAndroid = ! empty($androidUrl);
                @endphp

                <div class="mx-auto max-w-6xl px-4 sm:px-6">
                    <div class="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-zinc-900/40 sm:p-10">
                        <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-r from-violet-500/10 via-transparent to-fuchsia-500/10"></div>

                        <div class="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
                            <div>
                                <h2 class="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-3xl">
                                    Download Omsim
                                </h2>
                                <p class="mt-3 text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                                    Available on iOS and Android.
                                </p>
                                @if (! $hasIos || ! $hasAndroid)
                                    <p class="mt-2 text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                                        Coming soon on {{ ! $hasIos ? 'iOS' : '' }}{{ (! $hasIos && ! $hasAndroid) ? ' and ' : '' }}{{ ! $hasAndroid ? 'Android' : '' }}.
                                    </p>
                                @endif
                            </div>

                            <div class="grid gap-3 sm:grid-cols-2">
                                <a
                                    href="{{ $hasIos ? $iosUrl : '#' }}"
                                    @if (! $hasIos) aria-disabled="true" tabindex="-1" @endif
                                    class="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950 {{ $hasIos ? '' : 'pointer-events-none opacity-60' }}"
                                >
                                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
                                        <path d="M16.365 1.43c0 1.14-.43 2.19-1.24 3.03-.87.9-2.3 1.6-3.55 1.5-.16-1.23.43-2.52 1.2-3.33.86-.9 2.33-1.56 3.59-1.2zm3.99 16.97c-.38.87-.56 1.25-1.05 1.99-.67 1.02-1.62 2.3-2.79 2.31-1.04.01-1.31-.67-2.72-.67-1.41 0-1.71.66-2.75.68-1.17.01-2.07-1.15-2.74-2.17-1.87-2.86-2.07-6.22-.91-8.02.82-1.27 2.12-2.01 3.34-2.01 1.2 0 1.96.67 2.95.67.96 0 1.54-.67 2.94-.67 1.09 0 2.25.6 3.06 1.63-2.69 1.47-2.25 5.37.67 6.23z"/>
                                    </svg>
                                    iOS
                                </a>

                                <a
                                    href="{{ $hasAndroid ? $androidUrl : '#' }}"
                                    @if (! $hasAndroid) aria-disabled="true" tabindex="-1" @endif
                                    class="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950 {{ $hasAndroid ? '' : 'pointer-events-none opacity-60' }}"
                                >
                                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" class="h-5 w-5">
                                        <path d="M6.3 8.1c-.8 1.3-1.3 2.8-1.3 4.4v6.2c0 .7.6 1.3 1.3 1.3h.7V8.1h-.7z" fill="currentColor"/>
                                        <path d="M17.7 8.1V20h.7c.7 0 1.3-.6 1.3-1.3v-6.2c0-1.6-.5-3.1-1.3-4.4h-.7z" fill="currentColor"/>
                                        <path d="M8 8.1V20h8V8.1H8z" fill="currentColor"/>
                                        <path d="M8.5 6.7h7c-.5-1.1-1.4-2-2.5-2.5l1.2-1.7a.6.6 0 10-1-.7l-1.4 2a6 6 0 00-2.7 0l-1.4-2a.6.6 0 10-1 .7l1.2 1.7c-1.1.5-2 1.4-2.4 2.5z" fill="currentColor"/>
                                        <path d="M10.2 6.1a.6.6 0 11-1.2 0 .6.6 0 011.2 0zm4.8 0a.6.6 0 11-1.2 0 .6.6 0 011.2 0z" fill="#fff"/>
                                    </svg>
                                    Android
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 9) Footer -->
            @include('partials.site-footer')
        </main>
    </div>
@endsection
