# KSP Ops Dashboard — Plan

A one-screen ops view for the 2-day event launch. Pulls live data from Vercel KV, Stripe, and page-tracking pixels. Password-protected. Matches the Rise Up Kings brand palette.

## Goals

- **One glance answers:** "Is the ad spend working? Which variant is winning?"
- **No external tools required** — dashboard reads from the same Vercel project hosting the funnel.
- **Live-ish** — auto-refreshes every 30s; a "last updated 12s ago" indicator with a pulse when new data lands.
- **Zero-config to access:** one password, mobile-readable.

## What it shows (top to bottom)

### 1. Header bar
- RUK logo · "KSP Ops Dashboard"
- Date range picker: Today / Last 7d / Last 30d / All time / Custom
- Live indicator: green dot + "Updated 12s ago"

### 2. Top-line metric cards (5 wide row)
Each card shows the big number + delta vs. prior period in green/red.

| Metric | What it means | Source |
|---|---|---|
| **Visitors** | Unique sessions across all LPs | `/api/track` pageview events |
| **Checkout Starts** | Scrolled to embedded checkout OR clicked "Reserve" button | `/api/track` scroll/click events |
| **Purchases** | Completed Stripe payments | Stripe webhook → KV counter |
| **Revenue** | Sum of purchase amounts | Stripe webhook |
| **Conversion Rate** | Purchases ÷ Visitors | Computed |

### 3. A/B test panel (THE important one)
Side-by-side variant comparison with a winner callout.

```
┌─ A/B TEST · VSL vs No VSL ──────────────────────────────────┐
│                                                               │
│  VARIANT A · No VSL         VARIANT B · VSL (has video)      │
│  ───────────────────        ─────────────────────────        │
│  Visitors:    625            Visitors:    622                │
│  Start rate:  24.3%          Start rate:  32.1%              │
│  Purchases:   17             Purchases:   24                 │
│  CVR:         2.72%          CVR:         3.86% ← leader     │
│  Revenue:     $493           Revenue:     $696               │
│                                                               │
│  Variant B leading by +1.14pp  ·  87% confidence             │
│  (Need 95% + min 100 per arm to declare a winner)            │
└───────────────────────────────────────────────────────────────┘
```

### 4. Charts row (two charts side-by-side)

**Chart A — Visitors Over Time**
Line chart. Two lines (A in slate, B in gold). X-axis = time (hourly today, daily for 7d+). Y-axis = visitors.

**Chart B — Conversion Funnel**
Horizontal bar chart per variant. Four steps:
1. Landed on page (100%)
2. Scrolled to checkout
3. Started form (typed in name/email)
4. Purchased

Shows the drop-off at each step so you can see *where* people leak.

### 5. Revenue over time
Full-width area chart — cumulative revenue, stacked by variant. Pretty, motivational, obvious when ad spend starts paying off.

### 6. Live activity feed
Scrolling list of recent events, newest first:
- `2m ago · Purchase · Variant B · Alex M. · $29`
- `4m ago · Form started · Variant A · (anonymous)`
- `7m ago · Purchase · Variant A · Sarah K. · $29`
- `11m ago · Page view · Variant B · UTM: meta-lookalike`

Makes the dashboard feel alive during a launch.

### 7. Footer
- Last sync timestamp
- Link to Stripe dashboard (for refunds)
- Link to GHL (for contact export)

## Look & feel

- Dark mode by default (matches launch-night-in-a-war-room vibe)
- Background: `#0d0e10`, cards `#1c1919`, subtle gold borders `rgba(194,168,89,0.15)`
- Big numbers in **Montserrat Black** to match the LPs
- Gold (`#c2a859`) for Variant B / positive deltas / the winning number
- Slate (`#64748b`) for Variant A / neutral
- Green (`#22c55e`) / red (`#ef4444`) for up/down indicators
- Chart.js for graphs (lightweight CDN, no build step)
- Subtle animations: numbers count up on load, pulse on card when a new purchase hits

## Tech stack

| Piece | Choice | Why |
|---|---|---|
| Frontend | Vanilla HTML/CSS/JS | Matches LP stack; no build step |
| Charts | Chart.js via CDN | Lightweight, no framework needed |
| Data store | **Vercel KV** (Redis) | Same Vercel project; free tier covers this volume; atomic counters perfect for event counts |
| Read API | `/api/metrics` | Returns JSON `{visitors, purchases, revenue, variants, timeseries, recentActivity}` |
| Event tracking | `/api/track` | Receives `{event, variant, sessionId, utm}` from frontend |
| Purchase source | Stripe webhook → writes to KV | Authoritative — can't be spoofed |
| Auth | HTTP Basic Auth via Vercel middleware | One password in an env var; good enough |
| Refresh | Client polls `/api/metrics` every 30s | No websockets needed; keeps it simple |

## Data model (Vercel KV keys)

```
visitors:{variant}:{YYYY-MM-DD}:{HH}     → counter
checkout_starts:{variant}:{YYYY-MM-DD}   → counter
form_starts:{variant}:{YYYY-MM-DD}       → counter
purchases:{variant}:{YYYY-MM-DD}         → counter
revenue:{variant}:{YYYY-MM-DD}           → counter (cents)
activity:recent                          → list (capped at 50)
```

Resets aren't needed — the dashboard filters by date range at read-time.

## Events we track (from frontend)

| Event | When it fires | Variant-aware |
|---|---|---|
| `pageview` | Page load | Yes (reads ?v= or cookie) |
| `scroll_to_checkout` | Checkout section scrolls into view | Yes |
| `form_start` | User types first character in Name or Email | Yes |
| `checkout_submit` | User clicks "Complete My Registration" | Yes |
| (purchase) | Not tracked frontend — Stripe webhook is source of truth | Yes (via session metadata) |

Each event gets a session ID (cookie, 24h) so we can dedupe visitors.

## What we're *not* building (keep it simple)

- No user accounts / multi-user auth
- No custom date ranges with timezone picker (just the presets)
- No export to CSV (for v1 — easy to add later)
- No alerts / email digests
- No historical backfill (starts counting from launch day)

## Prototype vs. production

The prototype I'm pushing to GitHub Pages uses **hardcoded mock data** so you can see the exact look & feel. Switching to live data is ~2 hours of work once the Vercel project and KV store are set up — just wire `/api/metrics` to real KV reads.

## Rollout order

1. Prototype deploys to Pages now (mock data, for client review)
2. Once Stripe/GHL keys are in hand → scaffold the real Vercel project
3. Wire `/api/track` + `/api/metrics` + Stripe webhook → KV
4. Flip dashboard to live data
5. Add password gate
