alter table subscriptions
add column cancellation_reason text,
add column paused_until timestamp,
add column cancellation_feedback_submitted boolean default false;