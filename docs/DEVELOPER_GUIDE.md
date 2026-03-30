# DEVELOPER_GUIDE.md

## Overview

This is a Next.js App Router project that powers the RioPlex Business Exchange platform. It integrates:

* Supabase for authentication and database
* Stripe for subscriptions and billing
* Resend for transactional email delivery
* Tailwind CSS for styling

---

## Tech Stack

* Next.js (App Router)
* TypeScript
* Supabase (Auth + Postgres)
* Stripe (Billing + Subscriptions)
* Resend (Transactional Emails)
* Tailwind CSS

---

## Project Structure

* `src/app` — App Router pages and API routes
* `src/lib` — Shared utilities (Stripe, Supabase, helpers)
* `emails/` — React Email templates
* `components/` — UI components
* `types/` — Shared TypeScript types

---

## Environment Variables

Make sure the following environment variables are configured:

* `NEXT_PUBLIC_SUPABASE_URL`
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* `SUPABASE_SERVICE_ROLE_KEY`
* `STRIPE_SECRET_KEY`
* `STRIPE_WEBHOOK_SECRET`
* `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
* `RESEND_API_KEY`
* `CRON_SECRET`
* `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_BASE_URL`

---

## Running the Project Locally

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The app will be available at:

```
http://localhost:3000
```

---

## Key Integrations

### Supabase

* Handles authentication and database
* Used via server and client helpers in `src/lib`

### Stripe

* Handles subscriptions and billing
* Webhook processes lifecycle events

### Resend

* Sends transactional emails
* Email templates located in `emails/`

---

## Key Systems

### Billing System

The billing system is one of the most complex parts of the application.

👉 See: `BILLING.md` for full architecture and lifecycle details

---

## Notes for Developers

* Always test full flows (UI → API → Stripe → webhook → DB)
* Avoid modifying billing-related logic without understanding lifecycle behavior
* Prefer using existing helpers in `src/lib` rather than re-implementing logic

---

## Summary

This guide helps you:

* Understand the codebase structure
* Run the app locally
* Navigate key systems

For deeper system logic (especially billing), refer to dedicated documentation.
