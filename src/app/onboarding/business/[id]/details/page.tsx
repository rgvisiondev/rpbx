// app/onboarding/business/[id]/details/page.tsx
import { createClientRSC } from '@/../utils/supabase/server';
import { redirect } from 'next/navigation';
import DetailsFormClient from './BusinessDetailsForm';
import { ANNUAL_REVENUE_KEYS, CASH_FLOW_BUCKET_KEYS, EBITDA_BUCKET_KEYS, YEARS_IN_BUSINESS_KEYS, EMPLOYEE_COUNT_KEYS, isAllowedKey } from '@/lib/ranges';


export default async function DetailsStep({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: listingId } = await params;

  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/onboarding/business/${listingId}/details`
      )}`
    );
  }

  // Load THIS listing's draft
  const { data: draft } = await supabase
    .from('business_listings')
    .select(`
      id,
      title,
      ownership_percentage,
      annual_revenue_range,
      cash_flow_range,
      ebitda_range,
      years_in_business,
      employee_count_range,
      description,
      address
    `)
    .eq('id', listingId)
    .eq('owner_id', user.id)
    .eq('status', 'draft')
    .maybeSingle();

  if (!draft) {
    redirect('/dashboard/listings?err=no_draft_for_listing');
  }

  // ---- SERVER ACTION ----
  async function save(formData: FormData) {
    'use server';
    const { createClientRSC } = await import('@/../utils/supabase/server');
    const sb = await createClientRSC();
    const { data: { user } } = await sb.auth.getUser();

    const listingId = String(formData.get('listing_id') ?? '');

    if (!user) {
      redirect(
        `/login?next=${encodeURIComponent(
          `/onboarding/business/${listingId}/details`
        )}`
      );
    }

    // Make sure this listing still belongs to the user and is a draft
    const { data: currentDraft } = await sb
      .from('business_listings')
      .select('id, owner_id, status')
      .eq('id', listingId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!currentDraft || currentDraft.status !== 'draft') {
      redirect('/dashboard/listings?err=no_draft_for_listing');
    }

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
    const description =
      (String(formData.get('description') ?? '').trim()) || null;


    const payload = {
      ownership_percentage,
      annual_revenue_range: isAllowedKey(ANNUAL_REVENUE_KEYS, annual) ? annual : null,
      cash_flow_range: isAllowedKey(CASH_FLOW_BUCKET_KEYS, cash) ? cash : null,
      ebitda_range: isAllowedKey(EBITDA_BUCKET_KEYS,  ebitda) ? ebitda : null,
      years_in_business: isAllowedKey(YEARS_IN_BUSINESS_KEYS, years) ? years : null,
      employee_count_range: isAllowedKey(EMPLOYEE_COUNT_KEYS, empCount) ? empCount : null,
      description,
      status: 'draft' as const,
      owner_id: user.id,
    };

    const { error: updErr } = await sb
      .from('business_listings')
      .update(payload)
      .eq('id', listingId)
      .eq('owner_id', user.id);

    if (updErr) {
      console.error('Details save error', updErr);
      redirect(`/onboarding/business/${listingId}/details?msg=save_error`);
    }

    redirect(`/onboarding/business/${listingId}/review`);
  }

  return (
    <DetailsFormClient
      listingId={listingId}
      draft={draft}
      save={save}
    />
  );
}
