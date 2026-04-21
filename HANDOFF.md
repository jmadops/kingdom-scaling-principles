# KSP Funnel — Dev Handoff

**What:** $17.99 2-day virtual event. 50/50 A/B test (VSL vs. no-VSL) with embedded Stripe checkout. Lead data goes to Go High Level. Paid ads incoming.

**Stack:** Static HTML + Vercel serverless functions + Vercel KV (for dashboard).

---

## What I need from you

### 1. Stripe (10 min)
- `pk_live_...` and `sk_live_...` (+ test-mode versions)
- Create a **$17.99 one-time Product** → send me the `price_...` ID
- Add webhook endpoint at `https://scaling.riseupkings.com/api/stripe-webhook` listening to `checkout.session.completed` → send me the `whsec_...` signing secret

### 2. Go High Level (15 min)
- Confirm which sub-account
- Confirm Premium Workflow Triggers is enabled
- Create a workflow with **Inbound Webhook** trigger → Create/Update Contact (on email) → Add tag `ksp-lead` / `ksp-paid` → send me the webhook URL
  - *Or give me temporary workflow-builder access and I'll set it up*

### 3. Vercel (5 min)
- Invite `jay@jayjmilne.com` to the project
- Enable **Vercel KV** on the project (free tier)
- Custom domain: `scaling.riseupkings.com` — give DNS access so Vercel can be pointed at it

### 4. Ad pixels (whatever you're running)
- Meta Pixel ID (+ CAPI token if you have it)
- Google Ads conversion ID (if running)
- TikTok Pixel ID (if running)

---

## Env vars to set in Vercel

All listed in `.env.example`. The 8 you need:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
GHL_WEBHOOK_URL=https://services.leadconnectorhq.com/hooks/...
DASHBOARD_PASSWORD=<pick anything>
KV_REST_API_URL=<auto-filled by Vercel when KV is enabled>
KV_REST_API_TOKEN=<auto-filled by Vercel when KV is enabled>
```

---

## Total effort once keys are in

**~3–4 hours** to finish wiring the frontend to the API routes, test a real $17.99 transaction + refund, flip DNS, confirm dashboard is pulling live data.

Thanks — Jay
