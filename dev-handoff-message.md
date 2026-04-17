# Message to send to the developer team

Copy-paste this into Slack / email / wherever you talk to them.

---

**Subject:** Access needed to wire up the KSP checkout page

Hey team —

We're launching a custom branded checkout page for the **Kingdom Scaling Principles** 2-day virtual event ($29). The page is built — I just need the keys and access to wire it into Stripe and Go High Level.

The full funnel will be hosted on **Vercel**.

Please send me the following:

### 1. Stripe
- **Publishable key** (`pk_live_...`) and **Secret key** (`sk_live_...`) — from Stripe Dashboard → Developers → API keys. Also send me the test-mode versions (`pk_test_...` / `sk_test_...`) so I can test before going live.
- Confirmation that a **$29 one-time Product + Price** exists in the account for "Kingdom Scaling Principles — 2-Day Virtual Event." If it doesn't exist yet, please create it and send me the **Price ID** (starts with `price_...`).
- Once I deploy, I'll need a **webhook endpoint** configured in the Dashboard pointing at `https://{our-domain}/api/stripe-webhook`, subscribed to `checkout.session.completed`. Either you set it up and send me the **signing secret** (`whsec_...`), or give me admin access to do it myself.
- If Apple Pay / Google Pay matter: our domain needs to be **registered under Settings → Payment methods → Apple Pay → Register domain** once we deploy.

### 2. Go High Level
- Which **sub-account** does this offer live under? (I think it's a sub-account but want to confirm.)
- Confirmation that the sub-account has **Premium Workflow Triggers** enabled (needed for the "Inbound Webhook" trigger we're using).
- Once confirmed, I need someone with workflow-builder access to either:
  - **(A) Create the workflow for me** — trigger = "Inbound Webhook," actions = Create/Update Contact (match on email) + Add Tag (`ksp-lead` on form submit, `ksp-paid` after Stripe confirms) + add to whatever email sequence you want leads to go into. Then send me the **inbound webhook URL** the trigger generates.
  - **(B) Give me temporary workflow-builder access** so I can set it up myself and hand it back.

### 3. Deployment (Vercel)
- Invite `jay@jayjmilne.com` to the **Vercel team/project** that will host this funnel (or tell me which project name to expect).
- I'll need to add env vars there: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `GHL_WEBHOOK_URL`. So either give me the "Environment Variables" permission, or set them yourself once I send the values.

### What I already have / don't need
- The checkout page HTML/CSS is done.
- Landing page copy and design are done.
- Brand assets are in place.

**What to expect once I have everything:** ~4–6 hours of work to wire Stripe + GHL in, deploy to Vercel, and test end-to-end with a real $29 transaction + refund.

Thanks —
Jay

---

## Cheat sheet (for your reference)

| What they send | Where it goes | Sensitivity |
|---|---|---|
| `pk_live_...` Stripe publishable key | Frontend JS (public) | Low — safe in browser |
| `sk_live_...` Stripe secret key | Vercel env var | **Critical — never in frontend** |
| `whsec_...` Stripe webhook secret | Vercel env var | **Critical** |
| `price_...` Stripe Price ID | Serverless function | Low |
| GHL Inbound Webhook URL | Vercel env var + frontend fetch | Medium — treat as semi-secret |
| Vercel project access | N/A | Grants deploy rights |
