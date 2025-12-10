**Project Overview**

RPBX (RioPlex Business Exchange) is a Next.js 15 web application that provides a marketplace/business-exchange platform. The codebase is a full-stack app using:

- **Frontend**: Next.js (React 19), TypeScript, Tailwind CSS, shadcn-ui and other UI libraries.
- **Database**: Supabase for user storage and authentication.
- **CMS**: Sanity for content and studio configuration.
- **Auth / Data**: Supabase for server-side data and storage.
- **Payments**: Stripe for checkout, subscriptions, and webhooks.
- **Email**: Resend / react-email templates for transactional email sending.

This document explains how to set up the project locally, architecture highlights, important environment variables, and developer workflow notes.

**Quick Start**

Prerequisites
- **Node.js**: Use an active LTS (Node 18+ or Node 20 recommended).
- **Package manager**: `npm` is supported (project uses standard `package.json`). You can also use `pnpm` or `yarn` if you prefer.

Install dependencies

```
npm install
```

Run dev server

```
npm run dev
```

Build for production

```
npm run build
npm run start
```

Lint

```
npm run lint
```

**Project Structure & Entry Points**

Top-level notable files and directories

- `package.json` - scripts and dependency list.
- `next.config.ts`, `tsconfig.json` - Next and TypeScript configuration.
- `src/app/` - main Next.js app routes (App Router). Pages, API routes and layouts live here.
- `src/components/` - shared presentational components.
- `src/lib/` - application logic helpers and adapters (Stripe, Sanity, Supabase, utils).
- `src/sanity/` - Sanity client and env helper.
- `utils/supabase/` and `supabase/` - Supabase client wrappers used by server and middleware.
- `emails/` - React-based transactional email templates.

Important files to glance at when onboarding

- `src/app/layout.tsx` - metadata and top-level layout for the site.
- `src/app/api/` - Next.js serverless/edge API route implementations. This repo contains API routes for `stripe`, `subscribe`, `checkout`, `portal`, `billing`, and others.
- `src/lib/stripe.ts` - Stripe SDK wrapper (server-only usage).
- `src/sanity/env.ts` - Sanity environment variable assertions.

**Environment Variables**

This repository uses a mixture of server- and client-side environment variables. Client-safe variables begin with `NEXT_PUBLIC_`. Keep server keys (like `STRIPE_SECRET_KEY`) private and never commit them. Contact a developer for access to the environment keys.

Where to set them

- Locally: create a `.env.local` file at project root and add values there. Example:

```
NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=public-anon-key
NEXT_PUBLIC_SANITY_PROJECT_ID=abcd1234
NEXT_PUBLIC_SANITY_DATASET=development
NEXT_PUBLIC_SANITY_PRODUCTION_DATASET=production
NEXT_PUBLIC_SITE_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX
```

Notes
- Keep secret keys out of source control.
- Double-check `src/sanity/env.ts` — it asserts presence of the Sanity env vars at runtime.

**Development Workflow**

Working locally

- Start the app: `npm run dev` (visits `http://localhost:3000`).
- Sanity Studio is usually managed via `sanity` CLI config in `sanity.cli.ts` and `src/sanity` — run the Sanity commands from the sanity folder if you need to run a local Sanity studio.

API routes and server code

- API routes are under `src/app/api/*`. They run in a Node.js serverless environment with Next.js App Router conventions.
- Webhook endpoints: `src/app/api/stripe/webhook/route.ts` handles Stripe webhooks — verify `NEXT_PUBLIC_BASE_URL` or `NEXT_PUBLIC_SITE_URL` when creating webhooks.

Data & storage

- Supabase public storage is referenced in `src/lib/industryImages.ts` and other helpers. Supabase clients exist in `utils/supabase/*` and `supabase/*`.

Emails

- Email templates live in `emails/` and use `react-email`. Server-side send logic (Resend or other provider) exists in API routes.

**Sanity (CMS)**

Where configuration lives

- Sanity schema definitions are inside `src/sanity/schemaTypes` (and possibly `schemaTypesProduction`).
- Studio config: `sanity.config.ts` and `sanity.cli.ts` in the repo root; `src/sanity` contains client helper.

Common tasks

- Start local Sanity studio (if configured/installed): run the appropriate `sanity` CLI from the studio folder (if present) or consult the `sanity` docs for your version.
- To preview content locally, ensure `NEXT_PUBLIC_SANITY_PROJECT_ID` and dataset env vars are set.

**Supabase**

Supabase client usage

- Client wrapper: `utils/supabase/client.ts` and server variant `utils/supabase/server.ts`.
- Middleware integration: `utils/supabase/middleware.ts` supports auth where required.

Storage

- Public storage paths are constructed with `NEXT_PUBLIC_SUPABASE_URL` in `src/lib/industryImages.ts`.

**Stripe & Payments**

Key files

- `src/lib/stripe.ts` — server-side Stripe client initialization using `STRIPE_SECRET_KEY`.
- `src/app/api/checkout/*` — checkout routes.
- `src/app/api/stripe/webhook/route.ts` — Stripe webhook handling (receipt of events, sync to Supabase, etc.).

Local testing

- Use Stripe CLI to forward webhook events to `http://localhost:3000/api/stripe/webhook` and ensure `NEXT_PUBLIC_BASE_URL` matches what Stripe uses to build dashboard links.

**Testing & Linting**

Linting

- `npm run lint` runs Next/Eslint checks. Fix issues per lint output.

Unit/E2E

- This repo does not include a dedicated test harness in the root; if you add tests, prefer `vitest` or `jest` for unit tests and `playwright` or `cypress` for E2E. Keep tests isolated from production data.

**Build & Deployment**

Build

- `npm run build` creates a production Next build. `npm run start` serves it.

Deployment recommendations

- Vercel is a natural fit for Next.js App Router apps and integrates with environment variable management and serverless functions. Ensure environment variables in your deployment environment match your `.env.local` keys.
- If deploying to other providers, verify Node version support for Next 15 and serverless runtime configuration.

**Troubleshooting**

Common issues

- Missing env var errors: `src/sanity/env.ts` will throw when required Sanity vars are missing. Ensure `.env.local` includes the Sanity keys.
- Stripe webhooks failing: confirm webhook signing secret is configured and Stripe CLI is forwarding events properly.
- Supabase auth errors: check `NEXT_PUBLIC_SUPABASE_URL` + anon key and any server keys configured in server environments.

Debugging tips

- Use the browser devtools for client-side issues and `console.log` or server-side logging for API routes.
- Reproduce errors locally with `NODE_ENV=development` and the same env variable set used in production where possible (safely obfuscating secrets when sharing logs).

**Contributing**

Guidelines

- Follow the existing code style: TypeScript in the App Router layout, Tailwind utility classes, and `shadcn-ui` components.
- Add types to new utilities and exports.
- Keep UI components small and reusable; place shared components in `src/components/`.

PR process

- Create a feature branch and open a PR against `main` (or the repo default) with a clear description and testing steps.

**Useful Commands**

- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`
- Start (prod): `npm run start`
- Lint: `npm run lint`

**Reference: Important Paths**

- App root: `src/app/`
- Components: `src/components/` and `src/app/components/`
- Lib / services: `src/lib/` and `utils/supabase/`
- Sanity: `src/sanity/`, `sanity.config.ts`, `sanity.cli.ts`
- Emails: `emails/`

**Onboarding Notes for New Developers**

- When you join the project, ask for the following from the team: a `.env` template (or approved secrets), access to the Sanity project, repository of Stripe keys (test keys), and a Supabase project with credentials.
- Walk through `src/app/` routes and a few core API routes (checkout, stripe webhook, subscribe) to understand the data flow.

**Contact / Maintainers**

- Anthony Ramirez: `github.com/ajram01`
- Salvador Pruneda: `github.com/spruneda134`

---

Generated: developer guide for the RPBX repository. Keep this file updated as architecture or env requirements change.
