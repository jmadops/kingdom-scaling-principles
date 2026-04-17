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

    // Form-start: fire once the user types anything in name or email
    let firedFormStart = false;
    function wireFormStart() {
        const form = document.getElementById('embed-form') || document.getElementById('checkout-form');
        if (!form) return;
        const fire = () => {
            if (firedFormStart) return;
            firedFormStart = true;
            track('form_start');
        };
        form.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('input', fire, { once: true });
        });
    }

    // ----- Stripe mount -----
    async function mountStripe() {
        const mount = document.getElementById('checkout');
        if (!mount) return;

        // Fetch publishable key. If not configured, leave the placeholder in place.
        const cfg = await (async () => {
            try { const r = await fetch('/api/config'); if (!r.ok) return null; return r.json(); }
            catch { return null; }
        })();
        const pk = cfg && cfg.stripePublishableKey;
        if (!pk) {
            // Config unavailable (no env vars yet, or preview environment) — keep placeholder visible.
            return;
        }
        if (typeof Stripe !== 'function') {
            console.warn('[funnel] Stripe.js not loaded — did you forget the <script src="https://js.stripe.com/v3/"></script> tag?');
            return;
        }

        const stripe = Stripe(pk);

        // The submit button lives outside the form (form="embed-form"). Intercept click.
        const submitBtn = document.querySelector('.btn-embed-submit, .btn-submit');
        const form = document.getElementById('embed-form') || document.getElementById('checkout-form');
        if (!submitBtn || !form) return;

        submitBtn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            const name  = form.querySelector('[name="name"]').value.trim();
            const email = form.querySelector('[name="email"]').value.trim();
            if (!name || !email) {
                flashError(form, 'Please enter your name and email.');
                return;
            }

            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Loading secure checkout…';

            // Fire lead capture + submit event in parallel (don't block on either)
            post('/api/capture-lead', { name, email, variant: VARIANT, tag: 'ksp-lead' });
            track('checkout_submit');

            // Create the Stripe session
            const session = await post('/api/create-checkout-session', {
                name, email, variant: VARIANT,
            });
            if (!session || !session.clientSecret) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                flashError(form, 'Could not start checkout. Please try again or email support@riseupkings.com.');
                return;
            }

            // Swap the placeholder for the real embedded checkout.
            mount.innerHTML = '';
            try {
                // If Stripe renamed this method in a newer release, swap for createEmbeddedCheckoutPage.
                const checkout = await stripe.initEmbeddedCheckout({
                    clientSecret: session.clientSecret,
                });
                checkout.mount('#checkout');
                // Scroll the user to the Stripe form
                mount.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Hide the submit button once Stripe is mounted (it has its own)
                submitBtn.style.display = 'none';
            } catch (err) {
                console.error('[funnel] Stripe mount error:', err);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                flashError(form, 'Could not load checkout. Please try again.');
            }
        });
    }

    function flashError(form, msg) {
        let box = form.querySelector('.funnel-error');
        if (!box) {
            box = document.createElement('p');
            box.className = 'funnel-error';
            box.style.cssText = 'color:#c2a859;font-size:14px;margin-top:12px;text-align:center;';
            form.appendChild(box);
        }
        box.textContent = msg;
    }

    // ----- bootstrap -----
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    function init() {
        observeCheckoutScroll();
        wireFormStart();
        mountStripe();
    }
})();
