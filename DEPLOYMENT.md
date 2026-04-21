# Deployment — Adding Env Vars in Vercel

Step-by-step for the dev team. Everything is already wired up — once these env vars are in place, a push to `main` deploys a fully working funnel.

## Prerequisites

1. Vercel account (free tier is fine)
2. The keys/URLs listed in `HANDOFF.md` gathered up

## Step 1 — Connect the repo to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the repo: `jmadops/kingdom-scaling-principles`
3. Framework preset: **Other** (leave as static)
4. Root directory: **(leave blank — repo root)**
5. Build command: **(leave blank — this is static HTML + serverless functions)**
6. Output directory: **(leave blank)**
7. Click **Deploy**

First deploy will succeed but the checkout flow won't work yet — no env vars.

## Step 2 — Enable Vercel KV

KV is the data store for dashboard analytics counters.

1. In the Vercel project → **Storage** tab → **Create Database**
2. Pick **KV** → name it `ksp-analytics` → select a region close to the user base
3. Click **Create & Connect**
4. Vercel auto-populates `KV_REST_API_URL` and `KV_REST_API_TOKEN` as env vars — no manual step needed

## Step 3 — Add env vars

Project → **Settings** → **Environment Variables**.

For each of these, paste the value and select **Production** + **Preview** + **Development** environments.

| Variable | Where to get it | Example |
|---|---|---|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Reveal secret | `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys | `pk_live_...` |
| `STRIPE_PRICE_ID` | Stripe Dashboard → Product catalog → KSP event → copy Price ID | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → add endpoint (URL below) → Signing secret | `whsec_...` |
| `GHL_WEBHOOK_URL` | GHL sub-account → Automation → Workflows → Inbound Webhook trigger URL | `https://services.leadconnectorhq.com/hooks/...` |
| `DASHBOARD_PASSWORD` | Pick any strong string — this gates `/dashboard` with HTTP Basic Auth (username: `ksp`, password: this) | `any-strong-string` |
| `NEXT_PUBLIC_META_PIXEL_ID` | optional, for ads | `123456789012345` |
| `NEXT_PUBLIC_GOOGLE_CONVERSION_ID` | optional | `AW-XXXXXXXXX/XXXXXXXXX` |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | optional | `XXXXXXXXXXXXXXXXXX` |

*(`KV_REST_API_URL` and `KV_REST_API_TOKEN` are auto-set in Step 2 — do not add them manually.)*

## Step 4 — Create the Stripe webhook endpoint

After Vercel gives you a deploy URL (or after you've pointed a custom domain), tell Stripe where to send payment events.

1. Stripe Dashboard → **Developers** → **Webhooks** → **+ Add endpoint**
2. Endpoint URL: `https://scaling.riseupkings.com/api/stripe-webhook`
3. Events to send: `checkout.session.completed` (that's all we need for v1)
4. Save → click the new endpoint → **Signing secret → Reveal** → paste into `STRIPE_WEBHOOK_SECRET` in Vercel
5. Trigger a redeploy (Vercel → Deployments → top one → Redeploy)

## Step 5 — Point the custom domain

1. Vercel project → **Settings** → **Domains** → add `scaling.riseupkings.com`
2. Vercel tells you what DNS records to add — add them at your DNS provider
3. Wait for propagation (usually < 5 min)

## Step 6 — Register Apple Pay domain (optional but recommended)

Only needed if Apple Pay should appear in checkout.

1. Stripe Dashboard → **Settings** → **Payment methods** → **Apple Pay** → **Register domain**
2. Download the verification file → upload to `.well-known/apple-developer-merchantid-domain-association` in the repo (create the `.well-known/` folder if it doesn't exist) → commit + push → Stripe verifies

## Step 7 — Test

With everything wired up:

1. Visit `https://scaling.riseupkings.com/b` (VSL) or `https://scaling.riseupkings.com/a` (control)
2. Scroll to the checkout section at the bottom
3. Enter a test name + email
4. Click **Complete My Registration**
5. The placeholder swaps for the real Stripe Embedded Checkout
6. Pay with test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP
7. Confirm:
   - Redirect to `/thank-you/?session_id=...` succeeds
   - GHL contact created with tag `ksp-paid`
   - `/dashboard` shows the purchase in activity feed + counters tick up

To re-run with fresh tracking, clear cookies or use an incognito window.

Test card reference: [stripe.com/docs/testing](https://stripe.com/docs/testing)

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| "Could not start checkout" on submit | `STRIPE_SECRET_KEY` or `STRIPE_PRICE_ID` not set, or wrong mode (test vs live) | Check env vars; make sure all Stripe keys match mode |
| Webhook shows 400 in Stripe Dashboard | `STRIPE_WEBHOOK_SECRET` mismatch | Re-reveal signing secret in Stripe, paste into Vercel, redeploy |
| Contact not appearing in GHL | `GHL_WEBHOOK_URL` not set, or workflow inactive | Check env var; verify the workflow is published and the Inbound Webhook trigger is live |
| Dashboard shows mock data despite keys being set | `DASHBOARD_PASSWORD` not set, or KV not connected | Check env vars; confirm KV shows as "Connected" in Vercel → Storage |
| Apple Pay doesn't show | Domain not registered with Apple Pay via Stripe | Step 6 above |

## A/B testing note

The repo scaffolded a two-URL split (`/a` and `/b` rewrites in `vercel.json`). If the team prefers **VWO**, skip the /a /b URLs entirely — point all ads at one embedded LP and let VWO hide `#vsl-placeholder` for the control group. The frontend picks up `window.__variant` if VWO sets it, so variant tagging into Stripe/GHL stays correct.

## Questions

Email Jay at jay@jayjmilne.com or leave a comment on the commit.
