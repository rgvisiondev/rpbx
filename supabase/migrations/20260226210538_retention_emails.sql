/*
Phase 1 of the dunning flow update:
- cancellation_reason stores why a user manually canceled
- paused_until supports future pause/skip-style billing flows
- cancellation_feedback_submitted supports future cancellation UX
*/
alter table subscriptions
add column cancellation_reason text,
add column paused_until timestamp,
add column cancellation_feedback_submitted boolean default false;

/*
Phase 2 of the dunning flow update:
Tracks delinquent billing lifecycle so we can:
- send cancellation emails after failed retry exhaustion
- detect when a previously delinquent subscription has recovered
*/
alter table subscriptions
add column billing_issue_open boolean default false,
add column first_payment_failed_at timestamp,
add column dunning_canceled_email_sent_at timestamp,
add column payment_recovered_email_sent_at timestamp;

/* 
Phase 3 of the dunning flow update:
Tracks dunning stage so we can:
- send follow-up emails when payment is still missing
- send one final email before cancellation of subscription
*/
alter table subscriptions
add column dunning_stage text default 'none',
add column last_dunning_email_sent_at timestamp;

/*
Phase 4 of the dunning flow update:
Adds tracking for voluntary (user-initiated) cancellation UX:
- cancellation_feedback stores optional freeform feedback
- cancellation_requested_at stores when the user initiated cancellation
- cancellation_type distinguishes voluntary churn from system/dunning cancellations
*/
alter table subscriptions
add column cancellation_feedback text,
add column cancellation_requested_at timestamp,
add column cancellation_type text default 'voluntary';

/*
Phase 4b of the dunning flow update:
Tracks post-cancellation lifecycle for win-back emails:
- winback_email_sent_at ensures we only send one follow-up email per cancellation
*/
alter table subscriptions
add column winback_email_sent_at timestamp;

/*
Phase 5 of dunning flow update:
-
*/
alter table subscriptions
add column pause_status text default null,
add column pause_starts_at timestamp,
add column pause_ends_at timestamp,
add column pause_reason text,
add column pause_feedback text,
add column pause_email_sent_at timestamp,
add column resume_email_sent_at timestamp,
add column pause_scope text default 'subscription',
add column pause_count integer default 0,
add column last_pause_started_at timestamp,
add column last_pause_resumed_at timestamp;

/*
Phase 5 V2 of dunning flow update:
Tracks pause lifecycle emails separately so we can:
- send scheduled pause confirmation once
- send pause activation confirmation once
- send resume confirmation once
*/
alter table subscriptions
add column pause_scheduled_email_sent_at timestamp,
add column pause_activated_email_sent_at timestamp,
add column pause_resumed_email_sent_at timestamp;

/*
Phase 5 V3 of dunning flow update:
Tracks whether a resumed membership has a paused boosted listing
that can be restored after the main membership comes back.
*/
alter table subscriptions
add column paused_boost_restore_pending boolean default false,
add column paused_boost_subscription_id text,
add column paused_boost_restore_dismissed_at timestamp,
add column paused_boost_restore_completed_at timestamp;