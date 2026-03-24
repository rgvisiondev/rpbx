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