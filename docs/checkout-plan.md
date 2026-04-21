# KSP Checkout + GHL Integration Plan

> **Naming:** The offer is **Kingdom Scaling Principles (KSP)**. Folders renamed 2026-04-17: `KBP 2-day event/` → `KSP 2-day event/`, and the `kingdom-business-principles-*` LP folders → `kingdom-scaling-principles-*`.

## What we're building

A **branded checkout page** (`/checkout`) on the same domain as the LP where:

1. Customer enters **name, email, phone** in our form.
2. **Stripe Embedded Checkout** mounts directly on the page (stays on our domain — no redirect to `checkout.stripe.com`).
3. On submit, lead is pushed into **Go High Level** as a contact with tag `ksp-lead`.
4. After Stripe confirms payment, the same GHL contact is upgraded with tag `ksp-paid` (triggers confirmation email workflow, adds to attendee list).

Surrounding the Stripe widget: testimonials, trust badges, guarantee, FAQ — fully under our CSS control.

---

## Recommended architecture (simplest path that works)

```
┌─────────────────────────┐
│  Static LP (your HTML)  │
│  /checkout page         │
│  ├─ Name/email/phone    │──── fetch() ────► GHL Inbound Webhook (tag: ksp-lead)
│  └─ Stripe Embedded     │
│     Checkout <div>      │──── mount ──────► js.stripe.com
└───────────┬─────────────┘
            │ on submit, calls
            ▼
┌──────────────────────────┐
│ /api/create-session      │ ← ONE serverless function (Vercel/Netlify/Cloudflare)
│  Stripe.sessions.create  │   Holds the Stripe SECRET key.
└──────────┬───────────────┘
           │ returns client_secret
           ▼
      (customer pays)
           │
           ▼
┌──────────────────────────┐
│ /api/stripe-webhook      │ ← SECOND serverless function
│  verifies signature       │   Receives checkout.session.completed
│  → POST GHL Inbound URL   │   Upgrades contact with tag: ksp-paid
└──────────────────────────┘
```

**Two small serverless functions. No full backend. No database.** GHL holds the contact record. Stripe holds the payment record.

### Why this shape
- **Stripe Embedded Checkout** (not Payment Element) gives us a branded, on-page experience with wallets (Apple Pay / Google Pay), 3DS, SCA, and receipts for free. Payment Element is more customizable but overkill for one $17.99 SKU.
- **GHL Inbound Webhook** (not API v2 directly) because: no secrets in the browser, no OAuth refresh dance, and the non-technical operator can edit the downstream workflow visually inside GHL.
- Stripe's **client-only** no-server mode was **removed in the 2026-03-25 API release**, so the serverless function is mandatory now, not optional.

---

## Exact API keys / secrets we need

| Where it lives | What to grab | Notes |
|---|---|---|
| **Browser (public)** | Stripe **Publishable key** `pk_live_...` | Safe to paste into JS. Get it from Stripe Dashboard → Developers → API keys. |
| **Browser (public)** | GHL **Inbound Webhook URL** | Unique random URL generated when you create the workflow trigger. Treat as low-sensitivity — anyone with it can POST, so use idempotent logic. |
| **Serverless env var** | Stripe **Secret key** `sk_live_...` | Never in frontend. Dashboard → Developers → API keys → Reveal secret key. |
| **Serverless env var** | Stripe **Webhook signing secret** `whsec_...` | Created when you add a webhook endpoint (below). Used to verify webhook authenticity. |
| **Stripe Dashboard** | **Price ID** `price_...` | Created when you add the $17.99 Product. Hardcoded into the serverless function. |

**Test mode vs Live mode each have their own keys and webhook secret.** Build with test keys first, flip to live for launch.

---

## Webhook setup (exact steps)

### Stripe side
1. Dashboard → **Developers → Webhooks → + Add endpoint**
2. Endpoint URL = `https://{your-domain}/api/stripe-webhook`
3. Events to subscribe: **`checkout.session.completed`** (add `checkout.session.async_payment_succeeded` and `...async_payment_failed` only if you enable ACH/bank debits)
4. Save → click the new endpoint → **Signing secret → Reveal** → copy `whsec_...` into env var `STRIPE_WEBHOOK_SECRET`

### GHL side
1. GHL sub-account → **Automation → Workflows → + New Workflow**
2. Trigger = **Inbound Webhook**
3. Click the trigger → copy the generated webhook URL
4. Add a "Sample Data" POST (use your frontend's exact JSON shape) so GHL can auto-detect fields
5. Actions: **Create/Update Contact** (match on email) → **Add Tag** (`ksp-lead` or `ksp-paid` based on incoming `status` field) → **Add to Workflow** (whatever confirmation/email sequence you want)
6. *Note:* Inbound Webhook is a **Premium Workflow Trigger** — confirm the sub-account has it enabled (most paid plans do).

### Stripe Product/Price (one-time)
1. Dashboard → **Product catalog → + Add product**
2. Name: `Kingdom Scaling Principles — 2-Day Virtual Event`
3. Pricing = **Flat rate**, **One time**, **$17.99 USD**
4. Save → copy the `price_...` ID into the serverless function

---

## Limitations & gotchas to know up front

1. **You cannot do this without a backend.** Static HTML + Stripe alone won't cut it as of 2026 — Stripe removed the client-only integration. Two tiny serverless functions are the minimum. Vercel/Netlify/Cloudflare Workers all have free tiers that cover this easily.

2. **Hosting choice matters.** The LP is currently static HTML. We need a host that supports serverless functions. Cheapest paths:
   - **Vercel** (easiest if the LP stays as plain HTML — drop `/api/*.js` files next to `/index.html`)
   - **Netlify Functions** (same idea)
   - **Cloudflare Workers** (fastest, a bit more setup)

3. **Apple Pay / Google Pay require domain verification.** For wallets to show up on Embedded Checkout, the domain must be added under Stripe → Settings → Payment methods → Apple Pay → Register domain. ~2 min of DNS-file hosting.

4. **GHL Inbound Webhook URL is the only "auth."** Anyone who sniffs it can spam contacts into your workflow. Mitigate by: (a) always upserting by email, (b) adding a shared-secret field in the payload that the workflow checks with an `if/else` branch and discards if missing.

5. **Don't rely on the browser to mark "paid."** The customer's tab can close before Stripe finishes. The `ksp-paid` tag **must** come from the Stripe webhook (server-side), not from the frontend's success redirect.

6. **HighLevel's native Stripe integration is a trap for this use case.** It only tracks payments made through GHL's own forms/funnels — payments made on our custom Stripe page don't sync. So the tagging has to flow through our webhook → GHL inbound URL.

7. **GHL API v1 was end-of-life Dec 31, 2025.** If we ever swap the Inbound Webhook path for direct API calls, it must be v2 with a Private Integration Token (server-side only).

8. **Receipts & tax.** Stripe auto-emails the receipt. If this event is taxable (depends on state/country), enable **Stripe Tax** on the Product — adds ~30 sec.

---

## Simplest MVP path (recommended sequencing)

1. **Decide hosting** — Vercel is easiest. (Question for Jay: where is the LP currently deployed?)
2. **Stripe Dashboard:** create the Product/Price, grab the 3 keys, note the Price ID.
3. **GHL:** create the Workflow with Inbound Webhook trigger, map fields, grab the URL.
4. **Build `/checkout` page** — our form + testimonials + Stripe's embedded `<div>`.
5. **Build `/api/create-checkout-session`** — 15-line serverless function.
6. **Build `/api/stripe-webhook`** — 25-line function that verifies signature and POSTs to GHL.
7. **Test end-to-end with Stripe test cards** (`4242 4242 4242 4242`, any future expiry, any CVC).
8. **Flip to live keys**, register Apple Pay domain, smoke-test with a real card + refund.

**Est. build time:** 4–6 hours of focused work once we have the keys.

---

## Open questions for Jay

1. **Where is the LP hosted right now?** (determines serverless host choice)
2. **Which GHL sub-account** does this live under, and does it have Premium Workflow Triggers enabled?
3. **Should we collect phone number** pre-payment (extra field) or just name+email (higher conversion)?
4. **Post-purchase:** do we send them to the existing `thank-you/` page, or a new one with event-join instructions + calendar invite?
5. **Order bump / upsell** on the checkout page? (trivial to add later if not v1)
6. Do we want to **rename `KBP 2-day event/` → `KSP 2-day event/`** and the subfolders now, or defer?
