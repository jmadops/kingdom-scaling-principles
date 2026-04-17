# Kingdom Scaling Principles — 2-Day Event Funnel

Static landing pages + embedded Stripe checkout + Go High Level integration + ops dashboard. Deployed on Vercel.

## Quick start for developers

1. Clone the repo
2. `npm install` (installs `stripe` and `@vercel/kv`)
3. Copy `.env.example` → `.env.local` and fill in your keys (for local dev)
4. `npm run dev` to run locally via `vercel dev`
5. For deploy: push to `main` → Vercel auto-deploys. Env vars must be set in the Vercel dashboard, **not** in a committed file.

**Read [`HANDOFF.md`](./HANDOFF.md) for the short version of what's needed from the dev team.**

## What's in here

| Path | What it is |
|---|---|
| `kingdom-scaling-principles-lp/` | LP · No VSL · button-to-checkout |
| `kingdom-scaling-principles-vsl-lp/` | LP · VSL · button-to-checkout |
| `kingdom-scaling-principles-embedded-lp/` | LP · No VSL · embedded checkout at bottom **(control arm)** |
| `kingdom-scaling-principles-vsl-embedded-lp/` | LP · VSL · embedded checkout at bottom **(treatment arm)** |
| `checkout/` | Standalone branded checkout page (for email/retargeting links) |
| `thank-you/` | Post-purchase page |
| `dashboard/` | Ops dashboard — live A/B + analytics (password-protected in prod) |
| `api/` | Serverless functions (Stripe, GHL, tracking, dashboard reads) |
| `docs/` | Planning docs — checkout spec, dashboard spec, long-form handoff |

## The two live test pages

Once wired up, these are the URLs paid ads point at:

- `https://{domain}/a` — No VSL (control)
- `https://{domain}/b` — VSL (treatment)

Vercel rewrites `/a` → `kingdom-scaling-principles-embedded-lp/` and `/b` → `kingdom-scaling-principles-vsl-embedded-lp/` (see `vercel.json`).

For a 50/50 random split, the landing URL in ads can be `https://{domain}/` which hits the A/B router (sets a cookie + redirects).

## API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/create-checkout-session` | POST | Creates a Stripe embedded Checkout Session. Frontend mounts the returned `clientSecret`. |
| `/api/stripe-webhook` | POST | Receives `checkout.session.completed`. Writes purchase to KV, POSTs to GHL with tag `ksp-paid`. |
| `/api/track` | POST | Frontend fires events (pageview, scroll_to_checkout, form_start). Increments KV counters. |
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

- ✅ 4 LP variants built
- ✅ Standalone checkout built
- ✅ Dashboard prototype built (currently shows mock data)
- ✅ API routes scaffolded
- ⏳ Waiting on keys (see `HANDOFF.md`)
- ⏳ Frontend Stripe/tracking wiring (the 3–4 hours after keys arrive)
