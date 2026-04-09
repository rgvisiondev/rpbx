/*
Phase 1 of Matching Emails update
*/

create table if not exists public.match_digest_sends (
  id bigserial primary key,
  recipient_user_id uuid not null,
  recipient_type text not null
    check (recipient_type in ('investor', 'business_owner')),
  recipient_email text not null,
  subject text not null,
  match_count integer not null default 0
    check (match_count >= 0),
  featured_entity_id text null,
  included_entity_ids jsonb not null default '[]'::jsonb,
  sent_at timestamptz not null default now(),
  status text not null
    check (status in ('sent', 'failed')),
  provider_message_id text null,
  error_message text null
);

create index if not exists idx_match_digest_sends_recipient_user_id
  on public.match_digest_sends (recipient_user_id);

create index if not exists idx_match_digest_sends_recipient_type
  on public.match_digest_sends (recipient_type);

create index if not exists idx_match_digest_sends_sent_at
  on public.match_digest_sends (sent_at desc);

create index if not exists idx_match_digest_sends_status
  on public.match_digest_sends (status);

create table if not exists public.match_digest_skips (
  id bigserial primary key,
  recipient_user_id uuid not null,
  recipient_type text not null
    check (recipient_type in ('investor', 'business_owner')),
  recipient_email text null,
  reason text not null
    check (
      reason in (
        'no_strong_matches',
        'no_email',
        'missing_payload',
        'recipient_ineligible',
        'builder_returned_false',
        'unknown'
      )
    ),
  match_count integer not null default 0
    check (match_count >= 0),
  notes text null,
  skipped_at timestamptz not null default now()
);

create index if not exists idx_match_digest_skips_recipient_user_id
  on public.match_digest_skips (recipient_user_id);

create index if not exists idx_match_digest_skips_recipient_type
  on public.match_digest_skips (recipient_type);

create index if not exists idx_match_digest_skips_skipped_at
  on public.match_digest_skips (skipped_at desc);

create index if not exists idx_match_digest_skips_reason
  on public.match_digest_skips (reason);

/*
RLS
These tables are operational logs and should only be written/read by server-side
service-role code unless you later add explicit admin policies.
*/
alter table public.match_digest_sends enable row level security;
alter table public.match_digest_skips enable row level security;

/*
No public policies on purpose.
Service role bypasses RLS and can still insert/read.
*/

/* 
Phase 2 of Matching Emails update
*/

create table public.match_exposures (
  id uuid primary key default gen_random_uuid(),

  recipient_user_id uuid not null,
  recipient_type text not null check (recipient_type in ('investor', 'business_owner')),

  entity_type text not null check (entity_type in ('listing', 'investor')),
  entity_id uuid not null,

  matched_listing_id uuid, -- only for business owner context

  first_seen_at timestamptz,
  last_seen_at timestamptz,
  last_emailed_at timestamptz,

  dismissed_at timestamptz,
  contacted_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_match_exposures_recipient
on match_exposures (recipient_user_id, recipient_type);

create index idx_match_exposures_entity
on match_exposures (entity_type, entity_id);