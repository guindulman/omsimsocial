@extends('layouts.app')

@section('title', 'Data Deletion Request - Omsim')
@section('meta_description', 'Submit a data deletion request for Omsim Social.')

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

                    <a
                        href="{{ route('landing') }}"
                        class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#1E40FF] via-violet-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#1E40FF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
                    >
                        Home
                    </a>
                </div>
            </div>
        </header>

        <main id="main">
            <section class="py-16 sm:py-20">
                <div class="mx-auto max-w-6xl px-4 sm:px-6">
                    <div class="grid gap-10 lg:grid-cols-[1fr_520px] lg:items-start">
                        <div class="space-y-6">
                            <h1 class="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                                {{ $appName }} &mdash; Data Deletion Request
                            </h1>
                            <p class="text-sm text-zinc-600 dark:text-zinc-300">
                                Last updated: {{ now()->toDateString() }}
                            </p>

                            <section class="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                                <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">In-app options</h2>
                                <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    If you still have account access, you can remove posts, messages, or account data in-app first.
                                </p>
                            </section>

                            <section class="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                                <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">Request via web</h2>
                                <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    If you cannot access your account, submit this form and our privacy team will process your request.
                                </p>
                            </section>

                            <section class="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                                <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">Verification</h2>
                                <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    We may ask for additional verification before deletion to protect your account from unauthorized requests.
                                </p>
                            </section>

                            <section class="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                                <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">What we delete vs keep</h2>
                                <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    We delete account profile data, user-generated content, and messages as requested. We may retain limited
                                    records required for legal, security, fraud prevention, or compliance obligations.
                                </p>
                            </section>

                            <section class="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                                <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">Timeline</h2>
                                <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    Most requests are processed within 30 days after identity verification.
                                </p>
                            </section>

                            <section class="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                                <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">Backups retention</h2>
                                <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    Backup systems may retain deleted data for up to 90 days before permanent overwrite.
                                </p>
                            </section>

                            <section class="rounded-3xl border border-zinc-200/70 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                                <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">Contact email</h2>
                                <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                                    Privacy contact: <a class="font-semibold text-[#1E40FF] hover:underline" href="mailto:{{ $privacyEmail }}">{{ $privacyEmail }}</a>
                                </p>
                            </section>
                        </div>

                        <div class="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-zinc-900/40 sm:p-8">
                            <div aria-hidden="true" class="absolute inset-0 -z-10 bg-gradient-to-r from-violet-500/10 via-transparent to-fuchsia-500/10"></div>

                            @if (session('data_deletion_message'))
                                <div
                                    role="status"
                                    class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                                >
                                    {{ session('data_deletion_message') }}
                                </div>
                            @endif

                            @if ($errors->any())
                                <div
                                    role="alert"
                                    class="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
                                >
                                    Please correct the highlighted fields.
                                </div>
                            @endif

                            <form action="{{ route('data-deletion.submit') }}" method="POST" class="grid gap-4">
                                @csrf

                                <div style="position:absolute; left:-10000px; top:auto; width:1px; height:1px; overflow:hidden;" aria-hidden="true">
                                    <label>
                                        Website
                                        <input type="text" name="website" tabindex="-1" autocomplete="off" value="" />
                                    </label>
                                </div>

                                <div>
                                    <label for="full_name" class="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Full name (optional)
                                    </label>
                                    <input
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        maxlength="120"
                                        autocomplete="name"
                                        value="{{ old('full_name') }}"
                                        class="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                                    />
                                    @error('full_name')
                                        <p class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{{ $message }}</p>
                                    @enderror
                                </div>

                                <div>
                                    <label for="email" class="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Email (optional)
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        maxlength="255"
                                        inputmode="email"
                                        autocomplete="email"
                                        value="{{ old('email') }}"
                                        placeholder="you@example.com"
                                        class="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                                    />
                                    @error('email')
                                        <p class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{{ $message }}</p>
                                    @enderror
                                </div>

                                <div>
                                    <label for="username" class="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Username (optional)
                                    </label>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        maxlength="60"
                                        value="{{ old('username') }}"
                                        class="mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                                    />
                                    @error('username')
                                        <p class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{{ $message }}</p>
                                    @enderror
                                </div>

                                <fieldset>
                                    <legend class="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Request types
                                    </legend>
                                    <div class="mt-2 grid gap-2 sm:grid-cols-2">
                                        @php
                                            $typeOptions = [
                                                'profile' => 'Profile data',
                                                'ugc' => 'User-generated content',
                                                'messages' => 'Messages',
                                                'account' => 'Entire account',
                                            ];
                                            $selectedTypes = old('request_types', []);
                                        @endphp

                                        @foreach ($typeOptions as $value => $label)
                                            <label class="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-white/10">
                                                <input
                                                    type="checkbox"
                                                    name="request_types[]"
                                                    value="{{ $value }}"
                                                    @checked(in_array($value, $selectedTypes, true))
                                                />
                                                <span>{{ $label }}</span>
                                            </label>
                                        @endforeach
                                    </div>
                                    @error('request_types')
                                        <p class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{{ $message }}</p>
                                    @enderror
                                    @error('request_types.*')
                                        <p class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{{ $message }}</p>
                                    @enderror
                                </fieldset>

                                <div>
                                    <label for="details" class="text-sm font-semibold text-zinc-900 dark:text-white">
                                        Details
                                    </label>
                                    <textarea
                                        id="details"
                                        name="details"
                                        rows="6"
                                        maxlength="5000"
                                        placeholder="Add details that help us identify your account and request."
                                        class="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-950 shadow-sm outline-none placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-zinc-950/40 dark:text-white dark:placeholder:text-zinc-500 dark:focus-visible:ring-offset-zinc-950"
                                    >{{ old('details') }}</textarea>
                                    @error('details')
                                        <p class="mt-2 text-sm font-medium text-rose-600 dark:text-rose-300">{{ $message }}</p>
                                    @enderror
                                </div>

                                <button
                                    type="submit"
                                    class="mt-2 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#1E40FF] via-violet-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-[#1E40FF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
                                >
                                    Submit deletion request
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            @include('partials.site-footer')
        </main>
    </div>
@endsection

