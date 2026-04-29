alter table public.business_listings
add column if not exists secondary_industry text null;

alter table public.business_listings
drop constraint if exists business_listings_secondary_industry_not_same;

alter table public.business_listings
add constraint business_listings_secondary_industry_not_same
check (
  secondary_industry is null
  or nullif(trim(secondary_industry), '') is null
  or trim(secondary_industry) <> trim(industry)
);

create index if not exists idx_business_listings_secondary_industry
on public.business_listings (secondary_industry);

drop view if exists public.v_business_listings_with_promo;

create view public.v_business_listings_with_promo as
select
  bl.id,
  bl.owner_id,
  bl.title,
  bl.industry,
  bl.secondary_industry,
  bl.ownership_percentage,
  bl.annual_revenue_range,
  bl.cash_flow_range,
  bl.ebitda_range,
  bl.years_in_business,
  bl.employee_count_range,
  bl.county,
  bl.city,
  bl.state_code,
  bl.postal_code,
  bl.country_code,
  bl.description,
  bl.contact_email,
  bl.can_provide_financials,
  bl.can_provide_tax_returns,
  bl.status,
  bl.is_active,
  bl.is_hidden,
  bl.listing_image_choice,
  bl.listing_image_path,
  bl.listing_image_alt,
  bl.listing_image_w,
  bl.listing_image_h,
  bl.geocoded_lat,
  bl.geocoded_lng,
  bl.geocode_place_id,
  bl.geocode_confidence,
  bl.geocoded_at,
  bl.created_at,
  bl.updated_at,
  exists (
    select 1
    from public.listing_promotions lp
    where lp.listing_id = bl.id
      and lp.status in ('active', 'trialing')
      and (
        lp.current_period_end is null
        or lp.current_period_end > now()
      )
  ) as is_promoted_effective,
  exists (
    select 1
    from public.listing_evaluations le
    where le.listing_id = bl.id
      and le.status in ('paid', 'completed', 'fulfilled', 'purchased')
  ) as has_purchased_valuation
from public.business_listings bl;