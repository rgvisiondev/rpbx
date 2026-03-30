# RPBX

RPBX (RioPlex Business Exchange) is a Next.js platform that connects business owners and investors through a private, membership-based marketplace. The platform includes authenticated dashboards, listing management, subscription billing, transactional email workflows, and role-based access control for platform features.

---

## 🚀 Tech Stack

* **Frontend / Framework:** Next.js (App Router), React, TypeScript
* **Backend / Data:** Supabase (Auth + Database)
* **Billing:** Stripe (subscriptions, webhooks, lifecycle management)
* **Email:** Resend + React Email
* **Hosting / Infrastructure:** Vercel (with Cron Jobs)

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have access to:

* Node.js (LTS recommended)
* npm / pnpm / yarn
* Supabase project credentials
* Stripe (test or live keys)
* Resend API key

---

### Run Locally

```bash
npm install
npm run dev
```

Then open:

```
http://localhost:3000
```

---

## 🔐 Environment Variables

This project depends on several environment variables. These are **required** for local development and deployment.

### Core Categories

* **Supabase**

  * URL
  * Anon key
  * Service role key

* **Stripe**

  * Secret key
  * Webhook secret

* **Email (Resend)**

  * API key
  * From address

* **Application Config**

  * Site URL
  * App URLs

* **Cron / Background Jobs**

  * `CRON_SECRET`

⚠️ **Important:** Never commit secrets to the repository.

Refer to internal documentation for exact variable names and usage.

---

## 📜 Useful Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linter
```

---

## 📚 Documentation

Detailed internal documentation is located here:

👉 [Developer Guide](./docs/DEVELOPER_GUIDE.md)

The developer guide includes:

* Architecture overview
* Billing lifecycle (Stripe + cron + webhooks)
* Entitlements and access control
* Email workflows and templates
* Database structure and migrations

---

## 🧠 Key System Notes

* **Billing Lifecycle:**

  * Managed via Stripe webhooks and scheduled cron jobs
  * Handles payment failures, dunning, pauses, and cancellations

* **Authentication & Access Control:**

  * Supabase authentication
  * Server-side entitlement checks
  * Paywall gating for restricted features

* **Email System:**

  * Transactional emails powered by Resend
  * React Email templates used for consistency and maintainability

* **Listings & Marketplace Logic:**

  * Business listings and investor interactions
  * Role-based dashboards
  * Visibility controls and subscription-based access

---

## 🚢 Deployment

The application is designed to be deployed on **Vercel**.

Key considerations:

* Environment variables must be configured in Vercel
* Cron jobs must be enabled for billing automation
* Stripe webhooks must be properly configured to target deployed endpoints

---

## ⚠️ Security & Best Practices

* Do not commit secrets or credentials
* Use environment variables for all sensitive configuration
* Validate webhook signatures (Stripe)
* Restrict cron endpoints using `CRON_SECRET`

---

## 🤝 Contributing

If contributing:

* Follow existing code structure and patterns
* Keep commits clear and scoped
* Test billing and auth flows carefully (high-risk areas)

---

## 🧑‍💻 Maintainers

Maintained by the **RGVision / RPBX development team**.

For internal questions, refer to the developer guide or contact the project owner.

---

## 📌 Notes

* This README is intentionally concise and acts as the **entry point** to the repository.
* Detailed implementation and architecture documentation is maintained in `/docs`.

