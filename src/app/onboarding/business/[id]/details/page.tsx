// app/onboarding/business/[id]/details/page.tsx
import { createClientRSC } from '@/../utils/supabase/server';
import { redirect } from 'next/navigation';
import DetailsFormClient from './BusinessDetailsForm';

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
      book_value_range,
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
    const book = String(formData.get('book_value_range') ?? '');
    const ebitda = String(formData.get('ebitda_range') ?? '');
    const years = String(formData.get('years_in_business') ?? '');
    const empCount = String(formData.get('employee_count_range') ?? '');
    const description =
      (String(formData.get('description') ?? '').trim()) || null;

    const ALLOWED = {
      annual: new Set(['0_50k', '50k_100k', '100k_250k', '250k_1m', '1m_plus']),
      book: new Set(['25k_150k', '150k_750k', '750k_3m', '3m_7m']),
      ebitda: new Set(['lt_50k', '50k_150k', '150k_500k', '500k_1m', 'gt_1m']),
      years: new Set(['lt_1', '1_3', '3_5', '5_10', 'gt_10']),
      emp: new Set(['1_4', '5_10', '11_25', '26_50', '51_100', 'gt_100']),
    };

    const payload = {
      ownership_percentage,
      annual_revenue_range: ALLOWED.annual.has(annual) ? annual : null,
      book_value_range: ALLOWED.book.has(book) ? book : null,
      ebitda_range: ALLOWED.ebitda.has(ebitda) ? ebitda : null,
      years_in_business: ALLOWED.years.has(years) ? years : null,
      employee_count_range: ALLOWED.emp.has(empCount) ? empCount : null,
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
