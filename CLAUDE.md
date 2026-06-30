# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint via next lint
npm run email    # Preview React Email templates at http://localhost:3001
```

No test runner is configured. Validate billing and auth flows manually — they are high-risk areas.

To preview email templates in isolation: `npm run email` starts the React Email dev server against the `emails/` directory.

## Architecture

**RPBX (RioPlex Business Exchange)** — a Next.js 15 App Router platform connecting business owners and investors through a private, membership-based marketplace.

### Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript
- **Database/Auth:** Supabase (Postgres + Auth)
- **Billing:** Stripe (subscriptions, webhooks, cron-driven lifecycle)
- **Email:** Resend + React Email templates (`emails/`)
- **CMS:** Sanity v4 (blog, events, media — studio at `/studio`)
- **Styling:** Tailwind CSS v4 + shadcn/ui (`src/components/ui/`)
- **AI/Voice:** OpenAI + Vapi (AI evaluations and voice assistant)
- **Deployment:** Vercel (cron jobs configured in `vercel.json`)

### Route Structure (`src/app/`)

- `(auth)/` — login, signup, forgot-password, callback, signout
- `(member)/` — authenticated routes gated by `MemberGateShell.tsx`; contains `dashboard/` with sub-routes for listings, matches, billing, and investor profile
- `(footer)/` — public marketing pages (about, blog, pricing, events, etc.)
- `api/` — API routes organized by domain:
  - `api/billing/` — pause, resume, cancel, portal, webhook (Stripe)
  - `api/cron/` — dunning, winback, pause-auto-resume, match-digest (run daily/weekly via Vercel cron)
  - `api/stripe/` — checkout and subscription management
  - `api/listings/` — listing creation, ensure, redirect
  - `api/evaluations/` — AI-powered business evaluations
  - `api/vapi/` — voice assistant integration

### Key Library Files (`src/lib/`)

- **`entitlements.ts`** — Central access control. `getEntitlement()` checks Supabase for the user's subscription state and returns `{ entitled, status, blocked, needsBillingFix, role, ... }`. All paywall decisions flow through here.
- **`serverGuard.ts`** — Thin wrapper: `requireEntitlementOrNull()` returns a `block` reason (`"unverified"` | `"paywall"` | `null`). Use this in Server Components to gate page access.
- **`stripe.ts`** — Stripe client instance.
- **`supabase-auth-server.ts`** / **`supabase-admin.ts`** — Server-side Supabase clients (RSC and admin).
- **`matching/`** — Scoring engine that matches investors to listings (`matchInvestors.ts`, `matchListings.ts`, `scoreBusinessForInvestor.ts`, `scoreInvestorForBusiness.ts`).
- **`billing/`**, **`listings/`**, **`evaluations/`**, **`vapi/`** — Domain-specific utilities.

### Auth & Access Control

Middleware (`src/middleware.ts`) enforces a 20-minute idle session timeout for `/dashboard/*` routes using the `rpbx_last_activity` cookie, redirecting to `/logout?reason=inactive`.

Page-level access uses `getEntitlement()` / `requireEntitlementOrNull()` in Server Components. Status hierarchy: `active` > `trialing` > `past_due` > `unpaid` > `paused` > `incomplete` > `canceled`. Users with `past_due`/`unpaid` remain entitled but `needsBillingFix = true`.

### Billing Lifecycle

Stripe is the source of truth for payment state. The app layer manages pause/resume/dunning via:

1. **Webhooks** — `api/billing/webhook/` processes Stripe events and updates the `subscriptions` table.
2. **Cron jobs** (Vercel, see `vercel.json`):
   - `/api/cron/dunning` — daily at 9:00 UTC (payment failure outreach)
   - `/api/cron/winback` — daily at 9:30 UTC (churned user re-engagement)
   - `/api/cron/pause-auto-resume` — daily at 13:30 UTC (auto-resumes paused subs)
   - `/api/cron/match-digest` — Tuesdays at 15:00 UTC (investor/business match emails)
3. **Pause flow:** `cancel_at_period_end = true` on Stripe → webhook sets `pause_status = "active"` when it fires → cron re-creates subscription on resume.

Cron endpoints are secured with `CRON_SECRET`.

### Types

`src/types/database.types.ts` — auto-generated Supabase types. `src/types/billing.ts` — billing-specific types. `src/types/global.d.ts` — global declarations.

### Sanity CMS

Sanity powers public content (blog, events, media amplification). Studio at `/studio` (dev) and `/studio-events`. Schemas in `src/sanity/schemaTypes/` (dev) and `src/sanity/schemaTypesProduction/` (production). Configured via `sanity.config.ts` and `sanity.cli.ts`.

### Email Templates

React Email components in `emails/`. Key templates: subscription confirmation, payment failed/recovered, pause/resume lifecycle, match digests, winback, business listing live/incomplete. Run `npm run email` to preview them locally.

# RPBX Frontend Guidelines

## Backgrounds

| Use | Class |
|---|---|
| Default page shell | `bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top` |
| Hero / feature band | `bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center` |
| Hero w/ accent | `bg-[url('/images/backgrounds/black-mint-bg.png')] bg-cover bg-center` |

Do not default to `bg-neutral-50` or plain white.

---

## Layout Width

```tsx
// Page shell
className="w-full lg:max-w-[1140px] mx-auto px-5 lg:px-2"

// Section
className="flex flex-col w-full lg:max-w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-2"
```

---

## Brand Colors

| Token | Hex |
|---|---|
| Primary mint | `#60BC9B` |
| Mint hover | `#4fa987` |
| Soft mint bg | `#f8fbfa` |
| Mint ring/border | `#d8eee6` |
| Secondary blue | `#60A1BC` |
| Blue ring/border | `#d9edf4` |

No purple, orange, or unrelated colors.

---

## Cards

```tsx
// Standard
className="rounded-2xl border border-gray-100 bg-white shadow-lg"

// Large / feature
className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-xl"

// With hover lift
className="transition hover:-translate-y-0.5 hover:shadow-xl"
```

Padding: `p-5`, `p-6`, or `lg:p-7`. Always `rounded-2xl` or `rounded-[28px]`.

---

## Buttons & CTAs

Use `<Button>` from `@/app/components/Button` for primary actions.

Secondary pill link:
```tsx
<Link
  href="..."
  className="inline-flex w-fit items-center justify-center rounded-full border border-[#d8eee6] bg-[#f8fbfa] px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-[#60BC9B] hover:text-white"
>
  Review all matches
</Link>
```

One primary CTA per card max.

---

## Match Score Badges

Display scores as percentages (`75% Match`, not `75 Match`). Clamp defensively:

```ts
function toPercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}
```

Badge classes by tier:
- Excellent → `bg-[#60BC9B]` (mint)
- Strong → `bg-[#60A1BC]` (blue)
- Weak → neutral gray

```tsx
className="rounded-full bg-[#60BC9B] px-3 py-1.5 text-xs font-bold text-white shadow-sm ring-4 ring-[#d8eee6]"
```

---

## Pills & Count Badges

```tsx
<p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#f8fbfa] px-3.5 py-1.5 text-xs font-semibold text-gray-700 ring-1 ring-[#d8eee6]">
  <span className="rounded-full bg-[#60BC9B] px-2 py-0.5 text-[11px] font-bold text-white">
    {count}
  </span>
  <span>{count === 1 ? "listing match" : "listing matches"}</span>
</p>
```

Keep pill text short. Prefer `3 listing matches` over `Matches 3 of your listings`.

---

## Typography

- Page title: `h1`, `text-3xl font-bold leading-tight` (white on dark, gray-900 on light)
- Section title: `h2`
- Card title: `h3` or `h4`
- Supporting text: `text-sm text-gray-600 leading-6`

Uppercase eyebrow labels: use sparingly, only when they add hierarchy.

---

## Responsive Grids

```tsx
className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
// or
className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
```

Mobile-first always. Stack on mobile if horizontal layout gets cramped.

---

## Dashboard Pattern

```tsx
<div className="flex flex-col items-center bg-[url('/images/backgrounds/black-mint-bg.png')] bg-cover bg-center md:bg-fixed py-10 px-5 lg:px-2">
  <div className="bg-white flex flex-col w-full lg:max-w-[1140px] mx-auto rounded-2xl p-5 shadow-xl">
    ...
  </div>
</div>
```

Dashboard preview cards: image, name, industry/location, score badge, one context line, one CTA. No overloading.

---

## Match Page Pattern

- `NavGate` wrapper
- White textured bg, 1140px max width
- Black/black-mint hero with stat cards
- White card grid, score badges as percentages, short reason chips
- Use native `<details>` / `<summary>` for score breakdown or additional matches (server-render friendly)
- Show top matched listing first; hide extras behind disclosure

---

## Card Content Rules

**Business listing cards:** image, match badge, industry/title, city/state, one reason line, `View Listing` CTA.

**Investor cards:** avatar, match badge, name, org or "Independent Investor", primary industry, city, matched listing count, `View Profile` CTA.

No large text blocks inside card previews.

---

## Helper Utilities

```ts
function formatLocation(city?: string | null, stateCode?: string | null) {
  return [city, stateCode].filter(Boolean).join(", ");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
```

No `any`. Prefer explicit types from existing domain types.

---

## When Updating Existing UI

1. Match the pattern of nearby pages/components first.
2. Keep functionality intact — improve spacing, hierarchy, responsiveness.
3. No unrelated refactors in the same change.
4. Preserve routes, data contracts, and behavior unless explicitly told otherwise.