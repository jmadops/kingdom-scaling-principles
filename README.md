# Kingdom Scaling Principles — 2-Day Event Funnel

Static landing pages + embedded Stripe checkout + Go High Level integration + ops dashboard. Deployed on Vercel.

## Quick start for developers

1. Clone the repo
2. `npm install` (installs `stripe` and `@vercel/kv`)
3. Copy `.env.example` → `.env.local` and fill in your keys (for local dev)
4. `npm run dev` to run locally via `vercel dev`
5. For deploy: push to `main` → Vercel auto-deploys. Env vars must be set in the Vercel dashboard, **not** in a committed file.

**Dev team:** read [`HANDOFF.md`](./HANDOFF.md) (what I need from you) and [`DEPLOYMENT.md`](./DEPLOYMENT.md) (step-by-step Vercel setup with env vars).

## What's in here

| Path | What it is |
|---|---|
| `kingdom-scaling-principles-embedded-lp/` | LP · No VSL · embedded checkout **(control arm)** |
| `kingdom-scaling-principles-vsl-embedded-lp/` | LP · VSL · embedded checkout **(treatment arm)** |
| `thank-you/` | Post-purchase page |
| `dashboard/` | Ops dashboard — live A/B + analytics (password-protected in prod) |
| `api/` | Serverless functions (Stripe, GHL, tracking, dashboard reads) |
| `shared/` | Frontend wiring — `funnel.js` handles Stripe mount + tracking |
| `docs/` | Planning docs — checkout spec, dashboard spec, long-form handoff |

## The two live test pages

- `https://{domain}/a` — No VSL (control)
- `https://{domain}/b` — VSL (treatment)

Vercel rewrites `/a` → `kingdom-scaling-principles-embedded-lp/` and `/b` → `kingdom-scaling-principles-vsl-embedded-lp/` (see `vercel.json`).

**A/B testing is VWO-compatible.** The frontend reads `window.__variant` first, so if VWO assigns a variant, everything downstream (Stripe metadata, GHL tags, `/api/track` events) uses VWO's assignment. You can run with VWO on a single URL and skip the `/a` `/b` split entirely — the VSL element has `id="vsl-placeholder"` so VWO can hide it for the control group.

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/config` | GET | Returns public config (`stripePublishableKey`, pixel IDs) — frontend calls this on page load. |
| `/api/create-checkout-session` | POST | Creates a Stripe embedded Checkout Session. Frontend mounts the returned `clientSecret`. |
| `/api/capture-lead` | POST | Frontend form submit → proxies to GHL inbound webhook with tag `ksp-lead`. Keeps webhook URL server-side. |
| `/api/stripe-webhook` | POST | Receives `checkout.session.completed`. Writes purchase to KV, posts to GHL with tag `ksp-paid`. |
| `/api/track` | POST | Frontend fires events (pageview, scroll_to_checkout, form_start, checkout_submit). Increments KV counters. |
| `/api/metrics` | GET | Dashboard reads aggregated counters + recent activity. Protected by HTTP Basic Auth (`DASHBOARD_PASSWORD`). |

## Data flow

```
 Ad click → /a or /b → LP loads
   → /api/track fires "pageview" (counter++)
   → user scrolls to checkout → "scroll_to_checkout" fires
   → user types in name/email → "form_start" fires
   → clicks "Complete Registration"
   → frontend POSTs { name, email, variant } to /api/create-checkout-session
   → Stripe embedded Checkout mounts
   → user pays
   → Stripe sends webhook to /api/stripe-webhook
   → handler writes purchase to KV + POSTs to GHL inbound webhook
   → dashboard polls /api/metrics every 30s and shows live numbers
```

## Env vars

All required env vars are in [`.env.example`](./.env.example). Set them in **Vercel → Project → Settings → Environment Variables**. Never commit the actual values.

## Deploy

Vercel auto-deploys on push to `main`. For manual deploys: `vercel --prod`.

## Current status

- ✅ 2 LP variants built (both embedded checkout)
- ✅ Dashboard prototype built (mock data; swap to `/api/metrics` once keys are in)
- ✅ API routes built (Stripe, GHL proxy, tracking, config, metrics)
- ✅ Frontend wiring (`/shared/funnel.js`) — Stripe mount, form submit, tracking events, VWO-compatible variant detection
- ⏳ Waiting on keys (see `HANDOFF.md` and `DEPLOYMENT.md`)
