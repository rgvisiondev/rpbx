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
