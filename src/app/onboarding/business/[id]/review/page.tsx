// app/onboarding/business/[id]/review/page.tsx
import { createClientRSC } from '@/../utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Button from '@/app/components/Button';
import { Progress } from "@/components/ui/progress";
import { imageUrl } from '@/lib/industryImages';
import { ANNUAL_REVENUE_BUCKETS, CASH_FLOW_BUCKETS, EBITDA_BUCKETS, YEARS_IN_BUSINESS_BUCKETS, EMPLOYEE_COUNT_BUCKETS, labelForKey } from '@/lib/ranges';

export default async function ReviewStep({
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
        `/onboarding/business/${listingId}/review`
      )}`
    );
  }

  // Load THIS listing’s draft
  const { data: draft } = await supabase
    .from('business_listings')
    .select(`
      id,
      title,
      industry,
      address,
      county,
      city,
      contact_email,
      ownership_percentage,
      annual_revenue_range,
      cash_flow_range,
      ebitda_range,
      years_in_business,
      employee_count_range,
      description,
      listing_image_choice,
      address
    `)
    .eq('id', listingId)
    .eq('owner_id', user.id)
    .eq('status', 'draft')
    .maybeSingle();

  if (!draft) {
    redirect('/dashboard/listings?err=no_draft_for_listing');
  }

  const cashFlowLabel = labelForKey(draft.cash_flow_range, CASH_FLOW_BUCKETS);
  const ebitdaLabel = labelForKey(draft.ebitda_range, EBITDA_BUCKETS);
  const annualLabel = labelForKey(draft.annual_revenue_range, ANNUAL_REVENUE_BUCKETS);
  const yearLabel = labelForKey(draft.years_in_business, YEARS_IN_BUSINESS_BUCKETS);
  const empLabel = labelForKey(draft.employee_count_range, EMPLOYEE_COUNT_BUCKETS);

  const coverKey = draft.listing_image_choice as string | null;
  const coverUrl = coverKey ? imageUrl(coverKey) : null;

  // ---- SERVER ACTION ----
  async function publish(formData: FormData) {
    'use server';
    const { createClientRSC } = await import('@/../utils/supabase/server');
    const sb = await createClientRSC();
    const { data: { user } } = await sb.auth.getUser();

    const listingId = String(formData.get('listing_id') ?? '');

    if (!user) {
      redirect(
        `/login?next=${encodeURIComponent(
          `/onboarding/business/${listingId}/review`
        )}`
      );
    }

    // Make sure they own this listing and it is still a draft
    const { data: currentDraft } = await sb
      .from('business_listings')
      .select('id, owner_id, status')
      .eq('id', listingId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!currentDraft || currentDraft.status !== 'draft') {
      redirect('/dashboard/listings?err=no_draft_for_listing');
    }

    const { error: upErr } = await sb
      .from('business_listings')
      .update({ status: 'published', is_active: true })
      .eq('id', listingId)
      .eq('owner_id', user.id)
      .eq('status', 'draft')
      .single();

    if (upErr) {
      console.error("Publish listing error", upErr);
      redirect(`/onboarding/business/${listingId}/review?msg=publish_failed`);
    }

    redirect('/dashboard/listings');
  }

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen justify-center p-5">
      <div className='mx-auto max-w-lg lg:min-w-[550px]'>
        <p className='mb-2'> Profile 90% Complete</p>
        <Progress value={90} />
      </div>

      <div className="bg-white mx-auto max-w-lg lg:min-w-[550px] p-6 my-5 rounded-xl border border-neutral-200 shadow">
        <Link
          href={`/onboarding/business/${listingId}/details`}
          className="text-sm underline hover:text-[#60BC9B]"
        >
          &larr; Your Business at a Glance
        </Link>

        <form action={publish}>
          <input type="hidden" name="listing_id" value={listingId} />

          <h1 className="text-2xl font-semibold mt-2">Review & Go Live</h1>
          <p className="mt-2">
            Take a moment to review your details and make sure everything looks just right. Once you
            publish, your business will be visible to local investors ready to connect and explore new
            opportunities.
          </p>
          <hr className="mb-1 mt-4" />

          <div className="space-y-3 pt-4">
            {coverUrl && (
              <img
                src={coverUrl}
                alt="Listing cover"
                className="h-40 w-full object-cover rounded border"
              />
            )}
            <div><b>Title:</b> {draft.title ?? '—'}</div>
            <div><b>Industry:</b> {draft.industry ?? '—'}</div>
            {draft.address && (
              <div><b>Address:</b> {draft.address}</div>
            )}
            <div><b>County:</b> {draft.county ?? '—'}</div>
            <div><b>City:</b> {draft.city ?? '—'}</div>
            <div><b>Contact:</b> {draft.contact_email ?? '—'}</div>
            <hr className="mb-3 mt-4" />
            <div><b>Ownership %:</b> {draft.ownership_percentage ?? '—'}</div>
            <div><b>Annual revenue:</b> {annualLabel}</div>
            <div><b>Book value:</b> {cashFlowLabel}</div>
            <div><b>EBITDA:</b> {ebitdaLabel}</div>
            <div><b>Years in business:</b> {yearLabel}</div>
            <div><b>Employees:</b> {empLabel}</div>
            {draft.description && (
              <div>
                <b>Description:</b>
                <p className="whitespace-pre-wrap mt-1">{draft.description}</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <Button className="w-full">Publish Listing</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
