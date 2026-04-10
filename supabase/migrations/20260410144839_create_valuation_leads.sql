/*
TABLE: valuation_leads

PURPOSE:
This table stores lead captures for the FREE public valuation flow.

CONTEXT:
The existing schema already contains valuation-related tables, but those serve
different responsibilities:

1. public.listing_evaluations
   - used for listing-based valuation purchases
   - tied to a specific listing_id
   - tracks status and stripe_payment_intent_id
   - appropriate for paid/member valuation fulfillment

2. public.public_valuations
   - used for public valuation checkout records
   - tracks email plus Stripe session/payment identifiers
   - appropriate for paid public valuation purchases

WHY THIS NEW TABLE EXISTS:
The new free valuation experience is no longer a payment flow.
Users can request a valuation link by submitting basic contact information
without going through Stripe checkout.

Because of that, we need a table focused on:
- lead capture
- attribution (source_page / campaign)
- email delivery tracking
- future follow-up

WHY NOT REUSE public_valuations?
Although public_valuations is also public-facing, it is currently designed
around paid checkout behavior through Stripe, as shown by:
- stripe_payment_intent_id
- stripe_session_id

We intentionally keep free valuation requests separate so we do not mix:
- paid transactional records
with
- free lead generation records

EXPECTED USE:
This table is for FREE valuations.
Paid valuations should continue using the existing paid valuation tables.
*/

create table if not exists public.valuation_leads (
  id bigserial primary key,
  full_name text not null,
  email text not null,
  source_page text not null default 'unknown',
  source_path text null,
  campaign text not null default 'free_valuation',
  email_sent_at timestamptz null,
  resend_email_id text null,
  email_error text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_valuation_leads_email
  on public.valuation_leads (email);

create index if not exists idx_valuation_leads_created_at
  on public.valuation_leads (created_at desc);

create index if not exists idx_valuation_leads_source_page
  on public.valuation_leads (source_page);

  /*
Adds source tracking for listing-based valuations.

WHY:
Logged-in business owners should continue using public.listing_evaluations
because their valuation is tied to a specific business listing.

Previously, listing_evaluations represented paid valuation purchases.
Now that valuations may be temporarily free, we need a clean way to track
whether a listing evaluation was granted through:
- a paid checkout flow
- a free promotional flow

This keeps existing listing-linked behavior intact while preserving
rollback to paid valuations later.
*/

alter table public.listing_evaluations
add column if not exists access_type text
  check (access_type in ('paid', 'free'));

create index if not exists idx_listing_evaluations_access_type
  on public.listing_evaluations (access_type);

create unique index if not exists idx_valuation_leads_email_unique
  on public.valuation_leads (email);