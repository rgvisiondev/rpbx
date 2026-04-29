import { createClientRSC } from '@/../utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from "next";
import { geocodeAddresssTomTom } from '@/lib/geocode';
import EditListingFormClient from './EditListingFormClient';

import {
  ANNUAL_REVENUE_KEYS,
  CASH_FLOW_BUCKET_KEYS,
  EBITDA_BUCKET_KEYS,
  YEARS_IN_BUSINESS_KEYS,
  EMPLOYEE_COUNT_KEYS,
  isAllowedKey,
} from '@/lib/ranges';

type Params = { listingId: string };
type PageProps = { params: Promise<Params> };

export const metadata: Metadata = {
  title: "Edit Listing | RioPlex Business Exchange",
  description: "Manage your business listings and subscriptions on RioPlex Business Exchange.",
};

export default async function EditListingPage({ params }: PageProps) {
  const { listingId } = await params;

  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/dashboard/listings/${listingId}/edit`);

  const { data: listing } = await supabase
    .from('business_listings')
    .select(`
      id, owner_id, status, is_active,
      title, industry, secondary_industry, county, city, contact_email,
      ownership_percentage, annual_revenue_range, cash_flow_range, ebitda_range,
      years_in_business, employee_count_range, description, listing_image_choice,
      can_provide_financials, can_provide_tax_returns, address
    `)
    .eq('id', listingId)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!listing) notFound();

  async function updateListing(formData: FormData) {
    'use server';
    const { createClientRSC } = await import('@/../utils/supabase/server');
    const sb = await createClientRSC();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) redirect(`/login?next=/dashboard/listings/${listingId}/edit`);

    const id = String(formData.get('id') ?? '');
    if (!id) redirect('/dashboard/listings?msg=missing_id');

    const title = String(formData.get('title') ?? '').trim();
    const industry = String(formData.get('industry') ?? '').trim();
    const contact_email = String(formData.get('contact_email') ?? '').trim();
    const listing_image_choice =
      String(formData.get('listing_image_choice') ?? '').trim() || null;

    const ownership_percentage =
      formData.get('ownership_percentage') !== null &&
      String(formData.get('ownership_percentage')) !== ''
        ? Number(formData.get('ownership_percentage'))
        : null;

    const annual = String(formData.get('annual_revenue_range') ?? '');
    const cash = formData.get('cash_flow_range');
    const ebitda = formData.get('ebitda_range');
    const years = String(formData.get('years_in_business') ?? '');
    const empCount = String(formData.get('employee_count_range') ?? '');
    const description = (String(formData.get('description') ?? '').trim()) || null;
    const address = String(formData.get('address') ?? '').trim();

    const can_provide_financials = formData.get('can_provide_financials') === 'on';
    const can_provide_tax_returns = formData.get('can_provide_tax_returns') === 'on';

    const geo = address ? await geocodeAddresssTomTom(address) : null;

    const city = geo?.city || null;
    const county = geo?.county || null;

    const payload = {
      title,
      industry,
      county,
      city,
      contact_email: contact_email || null,
      listing_image_choice,

      ownership_percentage,
      annual_revenue_range: isAllowedKey(ANNUAL_REVENUE_KEYS, annual) ? annual : null,
      cash_flow_range: isAllowedKey(CASH_FLOW_BUCKET_KEYS, cash) ? cash : null,
      ebitda_range: isAllowedKey(EBITDA_BUCKET_KEYS, ebitda) ? ebitda : null,
      years_in_business: isAllowedKey(YEARS_IN_BUSINESS_KEYS, years) ? years : null,
      employee_count_range: isAllowedKey(EMPLOYEE_COUNT_KEYS, empCount) ? empCount : null,
      description,

      can_provide_financials,
      can_provide_tax_returns,

      country_code: geo?.countryCode ?? "US",
      state_code: geo?.stateCode ?? null,
      postal_code: geo?.postalCode ?? null,
      geocoded_lat: geo?.lat ?? null,
      geocoded_lng: geo?.lng ?? null,
      geocode_place_id: geo?.placeId ?? null,
      geocode_confidence: geo?.confidence ?? null,
      geocoded_at: geo ? new Date().toISOString() : null,
      address,
    };

    const { error: updErr } = await sb
      .from('business_listings')
      .update(payload)
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (updErr) {
      console.error('Update failed:', updErr);
      redirect(`/dashboard/listings/${id}/edit?msg=update_failed`);
    }

    const file = formData.get('cover') as File | null;
    if (file && file.size > 0) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const key = `${user.id}/${id}/cover.${ext}`;

      const { error: uploadErr } = await sb
        .storage
        .from('listings')
        .upload(key, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadErr) {
        console.error('Storage upload failed:', uploadErr);
        redirect(`/dashboard/listings/${id}/edit?msg=upload_failed`);
      }

      const { error: imgUpdErr } = await sb
        .from('business_listings')
        .update({ listing_image_path: key })
        .eq('id', id)
        .eq('owner_id', user.id)
        .single();

      if (imgUpdErr) {
        console.error('listing_image_path update failed:', imgUpdErr);
        redirect(`/dashboard/listings/${id}/edit?msg=image_path_failed`);
      }
    }

    redirect(`/dashboard/listings?msg=updated`);
  }

  return (
    <EditListingFormClient
      listing={listing}
      updateListing={updateListing}
    />
  );
}