import './bootstrap';

const ready = (fn) => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
        return;
    }
    fn();
};

const setTheme = (nextTheme) => {
    const theme = nextTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);

    // Keep toggle buttons in sync if multiple exist.
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        if (!(btn instanceof HTMLElement)) return;
        btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
        btn.setAttribute('data-theme', theme);
    });
};

ready(() => {
    const setScrollLock = (locked) => {
        document.body.classList.toggle('overflow-hidden', locked);
    };

    // Mobile nav toggle (hamburger -> dropdown).
    const mobileTrigger = document.querySelector('[data-mobile-menu-trigger]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    if (mobileTrigger instanceof HTMLButtonElement && mobileMenu instanceof HTMLElement) {
        const openClasses = ['opacity-100', 'translate-y-0'];
        const closedClasses = ['opacity-0', '-translate-y-2', 'pointer-events-none'];

        const setOpen = (isOpen) => {
            mobileTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

            if (isOpen) {
                mobileMenu.hidden = false;
                mobileMenu.classList.remove(...closedClasses);
                // Let the browser paint before we transition in.
                requestAnimationFrame(() => mobileMenu.classList.add(...openClasses));
                return;
            }

            mobileMenu.classList.remove(...openClasses);
            mobileMenu.classList.add(...closedClasses);

            // Hide after transition completes so it remains accessible while animating out.
            const onEnd = (e) => {
                if (e.target !== mobileMenu) return;
                mobileMenu.hidden = true;
                mobileMenu.removeEventListener('transitionend', onEnd);
            };
            mobileMenu.addEventListener('transitionend', onEnd);
        };

        const toggle = () => setOpen(mobileMenu.hidden);

        mobileTrigger.addEventListener('click', toggle);
        mobileMenu.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof HTMLElement)) return;
            if (target.closest('a')) setOpen(false);
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') setOpen(false);
        });
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (!(target instanceof Node)) return;
            if (mobileMenu.hidden) return;
            if (mobileMenu.contains(target) || mobileTrigger.contains(target)) return;
            setOpen(false);
        });

        // Ensure initial closed state classes are present (in case HTML changes).
        if (mobileMenu.hidden) {
            mobileMenu.classList.add(...closedClasses);
            mobileMenu.classList.remove(...openClasses);
        }
    }

    // Theme toggle (optional) persisted with localStorage.
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
        if (!(btn instanceof HTMLButtonElement)) return;
        btn.addEventListener('click', () => {
            const isDark = document.documentElement.classList.contains('dark');
            setTheme(isDark ? 'light' : 'dark');
        });
    });

    // Respect reduced motion preference by pausing autoplaying hero preview video.
    const heroVideo = document.querySelector('[data-hero-preview-video]');
    if (heroVideo instanceof HTMLVideoElement) {
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            heroVideo.pause();
        }
    }

    // Accessible FAQ accordion.
    document.querySelectorAll('[data-accordion-trigger]').forEach((button) => {
        button.addEventListener('click', () => {
            const controls = button.getAttribute('aria-controls');
            if (!controls) return;
            const panel = document.getElementById(controls);
            if (!panel) return;

            const isOpen = button.getAttribute('aria-expanded') === 'true';
            const nextOpen = !isOpen;
            button.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
            panel.hidden = !nextOpen;

            const icon = button.querySelector('[data-accordion-icon]');
            if (icon) {
                icon.classList.toggle('rotate-180', nextOpen);
            }
        });
    });

    // Footer legal modals (Terms / Privacy). Links still work as a fallback if JS is disabled.
    let activeLegalModal = null;
    let lastFocused = null;

    const closeActiveLegalModal = () => {
        if (!(activeLegalModal instanceof HTMLElement)) return;
        activeLegalModal.hidden = true;
        activeLegalModal = null;
        setScrollLock(false);

        if (lastFocused instanceof HTMLElement) {
            lastFocused.focus();
        }
        lastFocused = null;
    };

    const openLegalModal = (key, triggerEl) => {
        const modal = document.querySelector(`[data-legal-modal="${key}"]`);
        if (!(modal instanceof HTMLElement)) return false;

        // If the same modal is open, close it.
        if (activeLegalModal === modal) {
            closeActiveLegalModal();
            return true;
        }

        // Only one open at a time.
        if (activeLegalModal) closeActiveLegalModal();

        lastFocused = triggerEl instanceof HTMLElement ? triggerEl : document.activeElement;
        activeLegalModal = modal;
        modal.hidden = false;
        setScrollLock(true);

        const closeBtn = modal.querySelector('[data-legal-close]');
        if (closeBtn instanceof HTMLElement) closeBtn.focus();
        return true;
    };

    document.querySelectorAll('[data-legal-open]').forEach((link) => {
        link.addEventListener('click', (e) => {
            if (!(link instanceof HTMLElement)) return;
            // Respect "open in new tab/window" and other modified clicks.
            if (e instanceof MouseEvent) {
                if (e.button !== 0) return;
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            }
            const key = link.getAttribute('data-legal-open');
            if (!key) return;
            const handled = openLegalModal(key, link);
            if (handled) e.preventDefault();
        });
    });

    document.querySelectorAll('[data-legal-modal]').forEach((modal) => {
        if (!(modal instanceof HTMLElement)) return;

        modal.querySelectorAll('[data-legal-close]').forEach((btn) => {
            btn.addEventListener('click', closeActiveLegalModal);
        });

        const backdrop = modal.querySelector('[data-legal-backdrop]');
        if (backdrop instanceof HTMLElement) {
            backdrop.addEventListener('click', closeActiveLegalModal);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!activeLegalModal) return;
        closeActiveLegalModal();
    });

    // Initial sync for theme toggle button state.
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});
