@extends('layouts.app')

@section('title', 'Child Safety Standards (CSAE/CSAM) - OmsimSocial')
@section('meta_description', 'Read OmsimSocial child safety standards, including our zero-tolerance CSAE/CSAM policy, reporting channels, and enforcement process.')

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
                        href="{{ route('contact.show') }}"
                        class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#1E40FF] via-violet-500 to-pink-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-[#1E40FF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
                    >
                        Contact
                    </a>
                </div>
            </div>
        </header>

        <main id="main" class="py-14 sm:py-16">
            <div class="mx-auto max-w-4xl px-4 sm:px-6">
                <a
                    href="{{ route('landing') }}"
                    class="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-zinc-700 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
                >
                    <span aria-hidden="true">&larr;</span>
                    Back to OmsimSocial
                </a>

                <h1 class="mt-6 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-4xl">
                    Child Safety Standards (CSAE/CSAM) - OmsimSocial
                </h1>

                <div class="mt-8 space-y-6">
                    <section class="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                        <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">A) Our commitment</h2>
                        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                            <li>OmsimSocial has zero tolerance for Child Sexual Abuse and Exploitation (CSAE) and Child Sexual Abuse Material (CSAM).</li>
                            <li>We prohibit any content that sexualizes minors, exploits minors, or endangers children in any way.</li>
                            <li>OmsimSocial is intended for users aged 13+.</li>
                        </ul>
                    </section>

                    <section class="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                        <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">B) Reporting CSAE/CSAM</h2>
                        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                            <li>In-app reporting: Users can report profiles, posts, comments, and messages using the "Report" option inside the app.</li>
                            <li>
                                Email reporting: Users may report CSAE/CSAM concerns to
                                <a href="mailto:web2signin@gmail.com" class="font-semibold text-[#1E40FF] hover:underline">web2signin@gmail.com</a>.
                            </li>
                            <li>When reporting, include relevant details like username, link, or screenshot without describing harmful content.</li>
                        </ul>
                    </section>

                    <section class="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                        <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">C) How we handle reports</h2>
                        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                            <li>We review reports promptly.</li>
                            <li>Actions may include content removal, account restriction, suspension, or permanent bans.</li>
                            <li>We preserve relevant information as needed for investigation and to comply with legal requirements.</li>
                        </ul>
                    </section>

                    <section class="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                        <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">D) Legal compliance</h2>
                        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                            <li>We comply with applicable child safety laws and will report to relevant regional or national authorities where required.</li>
                        </ul>
                    </section>

                    <section class="rounded-3xl border border-zinc-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                        <h2 class="text-lg font-semibold text-zinc-950 dark:text-white">E) Contact</h2>
                        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700 dark:text-zinc-200">
                            <li>
                                Child safety contact:
                                <a href="mailto:web2signin@gmail.com" class="font-semibold text-[#1E40FF] hover:underline">web2signin@gmail.com</a>
                            </li>
                        </ul>
                    </section>
                </div>

                <p class="mt-8 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Last updated: {{ now()->format('F j, Y') }}
                </p>
            </div>

            <div class="mt-14">
                @include('partials.site-footer')
            </div>
        </main>
    </div>
@endsection
