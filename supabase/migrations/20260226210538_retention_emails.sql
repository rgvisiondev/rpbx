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