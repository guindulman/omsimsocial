<footer class="border-t border-zinc-200/70 py-10 dark:border-white/10">
    @php
        $iosUrl = config('services.stores.ios_app_store_url');
        $androidUrl = config('services.stores.android_play_store_url');
        $hasIos = ! empty($iosUrl);
        $hasAndroid = ! empty($androidUrl);
    @endphp

    <div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <a href="{{ route('landing') }}" class="inline-flex items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950">
            <span class="text-sm font-semibold tracking-tight text-zinc-950 dark:text-white">Omsim</span>
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">Verified friends</span>
        </a>

        <div class="flex flex-wrap items-center gap-2">
            <a
                href="{{ $hasIos ? $iosUrl : '#' }}"
                @if (! $hasIos) aria-disabled="true" tabindex="-1" @endif
                class="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950 {{ $hasIos ? '' : 'pointer-events-none opacity-60' }}"
            >
                iOS
            </a>
            <a
                href="{{ $hasAndroid ? $androidUrl : '#' }}"
                @if (! $hasAndroid) aria-disabled="true" tabindex="-1" @endif
                class="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-950 {{ $hasAndroid ? '' : 'pointer-events-none opacity-60' }}"
            >
                Android
            </a>
        </div>

        <nav aria-label="Footer" class="flex flex-wrap items-center gap-x-2 gap-y-2 text-sm font-semibold">
            <a
                href="{{ route('terms') }}"
                data-legal-open="terms"
                aria-controls="legal-terms-modal"
                class="rounded-lg px-3 py-2 text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
            >
                Terms
            </a>
            <a
                href="{{ route('privacy') }}"
                data-legal-open="privacy"
                aria-controls="legal-privacy-modal"
                class="rounded-lg px-3 py-2 text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
            >
                Privacy
            </a>
            <a
                href="{{ route('contact.show') }}"
                class="rounded-lg px-3 py-2 text-zinc-600 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:text-zinc-300 dark:hover:text-white dark:focus-visible:ring-offset-zinc-950"
            >
                Contact
            </a>
        </nav>
    </div>

    <div class="mx-auto mt-6 max-w-6xl px-4 sm:px-6">
        <p class="text-xs text-zinc-500 dark:text-zinc-400">
            &copy; {{ now()->year }} Omsim.
        </p>
    </div>

    <!-- Footer modals: keep legal content accessible without leaving the page. -->
    <div
        id="legal-terms-modal"
        data-legal-modal="terms"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-terms-title"
        hidden
        class="fixed inset-0 z-[70]"
    >
        <div data-legal-backdrop class="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"></div>
        <div class="relative mx-auto flex h-full max-w-3xl items-end px-4 py-8 sm:items-center sm:px-6">
            <div class="w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
                <div class="flex items-start justify-between gap-4 border-b border-zinc-200/70 px-6 py-5 dark:border-white/10">
                    <div>
                        <h2 id="legal-terms-title" class="text-lg font-semibold text-zinc-950 dark:text-white">Terms</h2>
                        <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Last updated: February 8, 2026
                        </p>
                    </div>
                    <button
                        type="button"
                        data-legal-close
                        class="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-900"
                    >
                        Close
                    </button>
                </div>
                <div class="max-h-[70vh] overflow-auto px-6 py-6">
                    @include('legal._terms_body')
                </div>
            </div>
        </div>
    </div>

    <div
        id="legal-privacy-modal"
        data-legal-modal="privacy"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-privacy-title"
        hidden
        class="fixed inset-0 z-[70]"
    >
        <div data-legal-backdrop class="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm"></div>
        <div class="relative mx-auto flex h-full max-w-3xl items-end px-4 py-8 sm:items-center sm:px-6">
            <div class="w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-zinc-900">
                <div class="flex items-start justify-between gap-4 border-b border-zinc-200/70 px-6 py-5 dark:border-white/10">
                    <div>
                        <h2 id="legal-privacy-title" class="text-lg font-semibold text-zinc-950 dark:text-white">Privacy</h2>
                        <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                            Last updated: February 8, 2026
                        </p>
                    </div>
                    <button
                        type="button"
                        data-legal-close
                        class="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E40FF] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-900"
                    >
                        Close
                    </button>
                </div>
                <div class="max-h-[70vh] overflow-auto px-6 py-6">
                    @include('legal._privacy_body')
                </div>
            </div>
        </div>
    </div>
</footer>
