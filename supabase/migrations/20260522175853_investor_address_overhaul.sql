/* 
Investor Address Overhaul Update: 
    In order to grow the platform we have switched from manual city inputs to using our TomTom API to allow investors to autocomplete their address
    input and then parse it into separate fields for future growth.
*/

alter table public.investor_profiles
  add column if not exists address text,
  add column if not exists county text,
  add column if not exists state_code text,
  add column if not exists country_code text default 'US',
  add column if not exists postal_code text,
  add column if not exists geocoded_lat double precision,
  add column if not exists geocoded_lng double precision,
  add column if not exists geocode_place_id text,
  add column if not exists geocode_confidence double precision,
  add column if not exists geocoded_at timestamptz,
  add column if not exists bio_ai_generated_at timestamptz;

create index if not exists idx_investor_profiles_city_state
  on public.investor_profiles (lower(city), state_code)
  where status = 'published' and is_hidden = false;

create index if not exists idx_investor_profiles_state
  on public.investor_profiles (state_code)
  where status = 'published' and is_hidden = false;

update public.investor_profiles
set state_code = 'TX'
where state_code is null
  and city is not null;