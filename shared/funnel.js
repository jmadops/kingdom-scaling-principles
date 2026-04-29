// ============================================
// KSP FUNNEL — frontend wiring
// Mounts Stripe Embedded Checkout, fires tracking events to /api/track,
// captures leads to /api/capture-lead, and plays nice with VWO.
//
// Usage: include <script src="../shared/funnel.js" defer></script>
// Requires: <script src="https://js.stripe.com/v3/"></script>
// ============================================

(function () {
    'use strict';

    // ----- variant detection (VWO-compatible) -----
    function getVariant() {
        // 1. VWO or any custom script can set window.__variant
        if (typeof window.__variant === 'string' && window.__variant) {
            return window.__variant;
        }
        // 2. URL query string ?v=a or ?v=b (lets ads force a variant if needed)
        const qs = new URLSearchParams(window.location.search);
        const qv = (qs.get('v') || '').toLowerCase();
        if (qv === 'a' || qv === 'b') return qv;
        // 3. Fall back to path
        const p = window.location.pathname;
        if (p.includes('vsl-embedded')) return 'b';
        if (p.includes('embedded-lp'))  return 'a';
        return 'standalone';
    }

    const VARIANT = getVariant();
    window.__variant = VARIANT; // make visible for downstream scripts (pixels etc.)

    // ----- tiny helper -----
    async function post(path, body) {
        try {
            const r = await fetch(path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body || {}),
            });
            if (!r.ok) return null;
            return await r.json();
        } catch (e) {
            // Network/API failures shouldn't break the UX (e.g. GitHub Pages preview has no /api)
            return null;
        }
    }
    function track(event) {
        return post('/api/track', { event, variant: VARIANT });
    }

    // ----- fire tracking events -----
    track('pageview');

    // Scroll-to-checkout: fire once when the checkout section enters view
    let firedScroll = false;
    function observeCheckoutScroll() {
        const target = document.getElementById('reserve') || document.getElementById('checkout');
        if (!target || firedScroll) return;
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting && !firedScroll) {
                    firedScroll = true;
                    track('scroll_to_checkout');
                    io.disconnect();
                }
            });
        }, { threshold: 0.3 });
        io.observe(target);
    }

    // ----- Stripe mount (on page load) -----
    async function mountStripe() {
        const mount = document.getElementById('checkout');
        if (!mount) return;

        const cfg = await (async () => {
            try { const r = await fetch('/api/config'); if (!r.ok) return null; return r.json(); }
            catch { return null; }
        })();
        const pk = cfg && cfg.stripePublishableKey;
        if (!pk) return;
        if (typeof Stripe !== 'function') {
            console.warn('[funnel] Stripe.js not loaded');
            return;
        }

        const stripe = Stripe(pk);

        track('checkout_submit');

        const session = await post('/api/create-checkout-session', { variant: VARIANT });
        if (!session || !session.clientSecret) {
            mount.innerHTML = '<p style="color:#c2a859;text-align:center;padding:20px;">Could not load checkout. Please refresh or email support@riseupkings.com.</p>';
            return;
        }

        mount.innerHTML = '';
        try {
            const checkout = await stripe.initEmbeddedCheckout({
                clientSecret: session.clientSecret,
            });
            checkout.mount('#checkout');
        } catch (err) {
            console.error('[funnel] Stripe mount error:', err);
            mount.innerHTML = '<p style="color:#c2a859;text-align:center;padding:20px;">Could not load checkout. Please refresh.</p>';
        }
    }

    // ----- bootstrap -----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    function init() {
        observeCheckoutScroll();
        mountStripe();
    }
})();
