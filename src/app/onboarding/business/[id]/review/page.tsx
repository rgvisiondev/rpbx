// app/onboarding/business/[id]/review/page.tsx
import { createClientRSC } from '@/../utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Button from '@/app/components/Button';
import { Progress } from "@/components/ui/progress";
import { imageUrl } from '@/lib/industryImages';

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
      book_value_range,
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

  const LABELS = {
    annual: {
      '0_50k': '0–50K', '50k_100k': '50K–100K', '100k_250k': '100K–250K', '250k_1m': '250K–1M', '1m_plus': '1M+',
    },
    book: {
      '25k_150k': '25K–150K', '150k_750k': '150K–750K', '750k_3m': '750K–3M', '3m_7m': '3M–7M',
    },
    ebitda: {
      'lt_50k': 'Under 50K', '50k_150k': '50K–150K', '150k_500k': '150K–500K', '500k_1m': '500K–1M', 'gt_1m': '1M+',
    },
    years: {
      'lt_1': '< 1 year', '1_3': '1–3 years', '3_5': '3–5 years', '5_10': '5–10 years', 'gt_10': '10+ years',
    },
    emp: {
      '1_4': '1–4', '5_10': '5–10', '11_25': '11–25', '26–50': '26–50', '51_100': '51–100', 'gt_100': '100+',
    },
  } as const;
  const fmt = (v: string | null | undefined, m: Record<string, string>) =>
    (v && m[v]) || '—';

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
            <div><b>Annual revenue:</b> {fmt(draft.annual_revenue_range, LABELS.annual)}</div>
            <div><b>Book value:</b> {fmt(draft.book_value_range, LABELS.book)}</div>
            <div><b>EBITDA:</b> {fmt(draft.ebitda_range, LABELS.ebitda)}</div>
            <div><b>Years in business:</b> {fmt(draft.years_in_business, LABELS.years)}</div>
            <div><b>Employees:</b> {fmt(draft.employee_count_range, LABELS.emp)}</div>
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
