# Message to send to the developer team

Copy-paste this into Slack / email / wherever you talk to them.

---

**Subject:** Access needed to wire up the KSP funnel ($17.99 2-day event)

Hey team —

We're launching a custom funnel for the **Kingdom Scaling Principles** 2-day virtual event ($17.99). The pages are built and are running a **50/50 A/B test** (VSL vs. no-VSL hero) with **embedded Stripe checkout** on both. Traffic is coming from paid ads.

The full funnel will live on **Vercel**. I've built a small ops dashboard that reads live data from Stripe + our own tracking — that also lives in the same Vercel project.

I need three things from you: Stripe access, GHL access, and Vercel access. Everything else is done.

---

### 1. Stripe

- **Publishable key** (`pk_live_...`) and **Secret key** (`sk_live_...`) — from Stripe Dashboard → Developers → API keys. Also send the **test-mode equivalents** (`pk_test_...` / `sk_test_...`) so I can test before flipping live.
- Please confirm (or create) a **$17.99 one-time Product** named `Kingdom Scaling Principles — 2-Day Virtual Event` and send me the **Price ID** (`price_...`).
- Once the Vercel project is deployed, I need a **webhook endpoint** in the Stripe Dashboard pointing at `https://{our-domain}/api/stripe-webhook`, subscribed to `checkout.session.completed`. Either set it up and send me the **signing secret** (`whsec_...`), or give me admin access to do it myself.
- If Apple Pay / Google Pay are important for this launch: our domain also needs to be registered under **Settings → Payment methods → Apple Pay → Register domain** once deployed.

### 2. Go High Level

- Which **sub-account** is this offer running under? (Confirm please — I assume sub-account, not agency level.)
- Does that sub-account have **Premium Workflow Triggers** enabled? (Required for the Inbound Webhook trigger we're using.)
- Then either:
  - **(A) You build the workflow and send me the URL** — trigger = "Inbound Webhook"; actions = Create/Update Contact (match on email) → Add Tag (`ksp-lead` on form submit, `ksp-paid` after Stripe confirms) → add to whatever email sequence should run for paid attendees.
  - **(B) Give me temporary workflow-builder access** and I'll set it up and hand it back.

### 3. Deployment (Vercel)

- Invite **`jay@jayjmilne.com`** to the Vercel team that will host the funnel (or tell me which project name to expect).
- I need to add these env vars:
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `GHL_WEBHOOK_URL`, `DASHBOARD_PASSWORD`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`
  — either give me "Environment Variables" permission or set them yourself once I send values.
- I'll also need **Vercel KV** enabled on the project (free tier is fine — stores our analytics counters for the dashboard).
- Confirm the **custom domain** / subdomain this should run under (e.g. `scaling.riseupkings.com` or similar). I'll need DNS access or someone who can add the records Vercel gives us.

### 4. Ad pixels (for tracking paid traffic)

Since traffic is coming from paid ads, please send me:

- **Meta (Facebook/Instagram) Pixel ID** — looks like a 15–16 digit number. I need this for the `fbq` script.
- **Meta Conversions API token** (optional but strongly recommended for iOS 17+ tracking accuracy).
- **Google Ads conversion ID + conversion label** — only if we're running Google Ads.
- **TikTok Pixel ID** — only if we're running TikTok.
- Any other tracking pixels running on the current brand (Klaviyo, Twitter, LinkedIn, etc.).

I'll fire the standard events: `PageView`, `InitiateCheckout`, `Purchase`.

---

### What I already have / don't need

- Landing pages × 4 variants — done, deployed to GitHub Pages for preview
- Standalone branded checkout page — done
- Embedded checkout section — done
- Ops dashboard (prototype with mock data) — done, wires to real data once Vercel + Stripe are connected
- Brand assets — done

**What to expect once I have everything:** ~4–6 hours to wire up Stripe + GHL + pixels, deploy to Vercel, configure DNS, and test end-to-end with a real $17.99 transaction + refund.

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
| Meta Pixel ID | Frontend JS (public) | Low |
| Meta CAPI token | Vercel env var (server-side firing) | Medium |
| Google Ads / TikTok IDs | Frontend JS | Low |
| Vercel project invite | Jay's email | Grants deploy rights |
| Vercel KV enabled | Vercel project dashboard | None |
| DNS access or domain admin | (varies) | Grants control of subdomain |
