@extends('layouts.app')

@section('title', 'Contact - Omsim')
@section('meta_description', 'Contact Omsim.')

@php
    $turnstileSiteKey = trim((string) config('turnstile.site'));
    $turnstileRequired = (bool) config('turnstile.required');
@endphp

@push('head')
    @if ($turnstileRequired && $turnstileSiteKey !== '')
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
    @endif
@endpush

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
                            href="{{ route('landing') }}"
                            class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#1E40FF] via-violet-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#1E40FF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
                        >
                            Home
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <main id="main">
            <section class="py-16 sm:py-20">
                <div class="mx-auto max-w-6xl px-4 sm:px-6">
                    <div class="grid gap-10 lg:grid-cols-[1fr_520px] lg:items-start">
                        <div>
                            <h1 class="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                                Contact
                            </h1>
                            <p class="mt-3 max-w-prose text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                                Have a question, feedback, or partnership idea? Send a message and we will reply.
                            </p>

                            <div class="mt-8 rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                                <div class="text-sm font-semibold text-zinc-950 dark:text-white">Support</div>
                                <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                                    For security, we do not publish a support email address. Use the form and we will reply.
                                </p>
                            </div>
                        </div>

                        <div class="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40 sm:p-8">
                            <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-r from-violet-500/10 via-transparent to-fuchsia-500/10"></div>

                            @if (session('contact_message'))
                                <div
                                    role="status"
                                    class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                                >
                                    {{ session('contact_message') }}
                                </div>
                            @endif

                            <form action="{{ route('contact.submit') }}" method="POST" class="grid gap-4">
                                @csrf
                                @php
                                    $issuedAt = now()->timestamp;
                                    $formSig = hash_hmac('sha256', 'contact|'.$issuedAt, (string) config('app.key'));
                                @endphp
                                <input type="hidden" name="_issued_at" value="{{ $issuedAt }}" />
                                <input type="hidden" name="_sig" value="{{ $formSig }}" />

                                <div style="position:absolute; left:-10000px; top:auto; width:1px; height:1px; overflow:hidden;" aria-hidden="true">
                                    <label>
                                        Company
                                        <input type="text" name="company" tabindex="-1" autocomplete="off" value="" />
                                    </label>
                                </div>

                                @error('form')
                                    <p class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
                                        {{ $message }}
                                    </p>
                                @enderror

                                <div>
                                    <label for="name" class="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Name
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autocomplete="name"
                                        required
                                        maxlength="100"
                                        value="{{ old('name') }}"
                                        class="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                                    />
                                    @error('name')
                                        <p class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{{ $message }}</p>
                                    @enderror
                                </div>

                                <div>
                                    <label for="email" class="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        inputmode="email"
                                        autocomplete="email"
                                        required
                                        maxlength="255"
                                        value="{{ old('email') }}"
                                        placeholder="you@example.com"
                                        class="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                                    />
                                    @error('email')
                                        <p class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{{ $message }}</p>
                                    @enderror
                                </div>

                                <div>
                                    <label for="message" class="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows="6"
                                        required
                                        maxlength="2000"
                                        class="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                                        placeholder="How can we help?"
                                    >{{ old('message') }}</textarea>
                                    @error('message')
                                        <p class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{{ $message }}</p>
                                    @enderror
                                </div>

                                @if ($turnstileRequired && $turnstileSiteKey !== '')
                                    <div>
                                        <div class="cf-turnstile" data-sitekey="{{ $turnstileSiteKey }}"></div>
                                        @error('turnstile')
                                            <p class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{{ $message }}</p>
                                        @enderror
                                    </div>
                                @endif

                                <button
                                    type="submit"
                                    class="mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#1E40FF] via-violet-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#1E40FF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
                                >
                                    Send message
                                </button>

                                <p class="text-xs text-zinc-500 dark:text-zinc-400">
                                    We only use your info to respond.
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            @include('partials.site-footer')
        </main>
    </div>
@endsection
