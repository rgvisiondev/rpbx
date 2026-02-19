-- 01) Add columns
alter table public.business_listings
add column if not exists is_hidden boolean not null default false;

alter table public.investor_profiles
add column if not exists is_hidden boolean not null default false;

-- 02) Update business listing view
create or replace view public.v_business_listings_with_promo as
select
  bl.id,
  bl.title,
  bl.industry,
  bl.ownership_percentage,
  bl.annual_revenue_range,
  bl.cash_flow_range as book_value_range,
  bl.ebitda_range,
  bl.years_in_business,
  bl.employee_count_range,
  bl.county,
  bl.can_provide_financials,
  bl.can_provide_tax_returns,
  bl.contact_email,
  bl.description,
  bl.is_active,
  bl.created_at,
  bl.updated_at,
  bl.owner_id,
  bl.city,
  bl.status,
  bl.listing_image_path,
  bl.listing_image_alt,
  bl.listing_image_w,
  bl.listing_image_h,
  bl.state_code,
  bl.country_code,
  bl.postal_code,
  bl.geocoded_lat,
  bl.geocoded_lng,
  bl.geocode_place_id,
  bl.geocoded_at,
  bl.geocode_confidence,
  bl.listing_image_choice,
  (
    exists (
      select 1
      from public.listing_promotions lp
      where lp.listing_id = bl.id
        and lp.status = any (array['active'::text, 'trialing'::text, 'past_due'::text])
        and coalesce(lp.current_period_end, now()) > now()
    )
  ) as is_promoted_effective,
  coalesce(
    (
      select (le.status = 'purchased'::text)
      from public.listing_evaluations le
      where le.listing_id = bl.id
      limit 1
    ),
    false
  ) as has_purchased_valuation,
  bl.is_hidden  -- NEW
from public.business_listings bl
where
  bl.is_active = true
  and bl.status = 'published'
  and bl.is_hidden = false;


-- 03) Create new Investor profile view
create or replace view public.v_investor_profiles_public as
select
  ip.*,
  (
    exists (
      select 1
      from public.subscriptions s
      where s.user_id = ip.user_id
        and s.status = any (array[
  'active'::public.subscription_status,
  'trialing'::public.subscription_status
])
    )
  ) as has_paid_access
from public.investor_profiles ip
where
  ip.status = 'published'
  and ip.is_hidden = false
  and exists (
      select 1
      from public.subscriptions s
      where s.user_id = ip.user_id
        and s.status = any (array[
  'active'::public.subscription_status,
  'trialing'::public.subscription_status
])
  );

-- 04) Performance indexes

-- Business listings visibility index
create index if not exists idx_business_listings_public
on public.business_listings (is_active, status, is_hidden);

-- Investor profile visibility index
create index if not exists idx_investor_profiles_public
on public.investor_profiles (status, is_hidden);

-- Subscriptions lookup index (used by investor view EXISTS clause)
create index if not exists idx_subscriptions_user_id_status
on public.subscriptions (user_id, status);