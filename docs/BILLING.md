# BILLING.md

## Overview

The billing system is built on top of Stripe and extended with application-level lifecycle logic.

Stripe is responsible for billing execution, while the application manages:

* pause/resume behavior
* dunning and recovery flows
* subscription history
* UI representation of subscriptions

---

## Architecture


### Stripe Layer (Source of Truth)

Stripe handles:

* payment collection
* invoices and retries
* subscription status

### Application Layer

The application handles:

* pause lifecycle
* resume behavior
* cancellation metadata
* cron-based workflows
* UI shaping of subscriptions

---

## Core Principle

Stripe drives billing state.
The application interprets that state for product behavior.

---

## Subscription Lifecycle

### Active → Pause

* Triggered via `/api/billing/pause`
* Stripe:

  * `cancel_at_period_end = true`
* DB:

  * `pause_status = "scheduled"`

---

### Pause Activation

When Stripe cancels the subscription:

* webhook converts it to:

  * `pause_status = "active"`
  * sets `pause_ends_at`
* Treated as paused, not churned

---

### Pause → Auto Resume

Handled by:

```
/api/cron/pause-auto-resume
```

When:

* `pause_status = "active"`
* `pause_ends_at <= now()`

Then:

* create new Stripe subscription
* attach metadata:

  * `auto_resume_from_pause`
  * `resumed_from_subscription_id`

Webhook:

* carries pause history forward
* links new subscription to old one
* sends resume email

---

### Active → Cancel (Voluntary)

* Triggered via `/api/billing/cancel`
* Stripe:

  * `cancel_at_period_end = true`

DB stores:

* cancellation reason
* feedback
* `cancellation_type = "voluntary"`

---

### Failed Payment (Dunning)

Webhook sets:

* `billing_issue_open = true`

Cron handles:

* reminder email
* final warning
* cancellation after retries

---

### Win-back Flow

Handled by:

```
/api/cron/winback
```

* Sends follow-up email after churn
* Controlled by `winback_email_sent_at`

---

## Cron Jobs

### Dunning

* `/api/cron/dunning`

### Winback

* `/api/cron/winback`

### Pause Auto Resume

* `/api/cron/pause-auto-resume`

All require:

```
Authorization: Bearer ${CRON_SECRET}
```

---

## Billing API Routes

* `/api/billing/pause`
* `/api/billing/resume`
* `/api/billing/cancel`
* `/api/billing/continue`
* `/api/billing/rows`

---

## Data Model Notes

The `subscriptions` table includes:

* Stripe fields (status, price, etc.)
* lifecycle tracking fields:

  * pause fields
  * dunning fields
  * cancellation fields
  * winback fields

---

## Historical Subscriptions

Subscriptions are **append-only**.

* old rows are never deleted
* new rows are created on resume
* history is preserved

---

## Billing UI Behavior

UI must use:

```
/api/billing/rows
```

This route:

* collapses related subscriptions
* hides superseded rows
* returns clean UI-ready data

---

## Key Rules (Do Not Break)

* Webhook is the source of truth
* Cron handles timing, not state authority
* Pause is app-layer logic
* Subscriptions are never deleted
* Billing UI must not use raw DB rows
* Resume must link via `resumed_from_subscription_id`

---

## Common Pitfalls

* Duplicate subscriptions in UI → rows collapsing issue
* Missing payment method → auto-resume fails
* Breaking webhook logic → entire lifecycle breaks
* Not linking resumed subscriptions → history breaks

---

## Summary

The billing system is designed to:

* preserve full history
* extend Stripe with lifecycle features
* maintain clean UI representation
* support flexible subscription flows

Handle changes carefully — small mistakes can affect multiple systems.
