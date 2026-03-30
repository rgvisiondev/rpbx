import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PausedSubscriptionRow = {
  id: string;
  user_id: string;
  listing_id: string | null;
  purpose_sub: string | null;
  product_name: string | null;
  price_id: string | null;
  quantity: number | null;
  pause_status: string | null;
  pause_ends_at: string | null;
  last_pause_resumed_at: string | null;
};

type RelatedSubscriptionRow = {
  id: string;
  listing_id: string | null;
  purpose_sub: string | null;
  product_name: string | null;
  status: string | null;
};

function isAuthorizedCronRequest(req: Request) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  return !!process.env.CRON_SECRET && authHeader === expected;
}

function sameLogicalContext(
  candidate: Pick<
    RelatedSubscriptionRow,
    "listing_id" | "purpose_sub" | "product_name"
  >,
  target: Pick<
    PausedSubscriptionRow,
    "listing_id" | "purpose_sub" | "product_name"
  >,
) {
  if (target.listing_id) {
    return candidate.listing_id === target.listing_id;
  }

  if (target.purpose_sub) {
    return (
      candidate.purpose_sub === target.purpose_sub &&
      candidate.product_name === target.product_name
    );
  }

  return candidate.product_name === target.product_name;
}

function isLiveStatus(status: string | null) {
  return (
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "unpaid"
  );
}

function getPaymentMethodIdFromUnknown(
  value: string | Stripe.PaymentMethod | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}

async function resolveReusablePaymentMethodId(params: {
  stripe: Stripe;
  pausedSubscriptionId: string;
  stripeCustomerId: string;
}) {
  const { stripe, pausedSubscriptionId, stripeCustomerId } = params;

  try {
    const oldSub = await stripe.subscriptions.retrieve(pausedSubscriptionId, {
      expand: ["default_payment_method"],
    });

    const subDefaultPaymentMethod = getPaymentMethodIdFromUnknown(
      oldSub.default_payment_method,
    );

    if (subDefaultPaymentMethod) {
      return subDefaultPaymentMethod;
    }
  } catch (error) {
    console.error(
      `[pause-auto-resume] Failed retrieving old paused subscription ${pausedSubscriptionId} for payment method lookup:`,
      error,
    );
  }

  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId);

    if (!("deleted" in customer)) {
      const customerDefaultPaymentMethod = getPaymentMethodIdFromUnknown(
        customer.invoice_settings?.default_payment_method,
      );

      if (customerDefaultPaymentMethod) {
        return customerDefaultPaymentMethod;
      }
    }
  } catch (error) {
    console.error(
      `[pause-auto-resume] Failed retrieving customer ${stripeCustomerId} for default payment method lookup:`,
      error,
    );
  }

  return null;
}

export async function GET(req: Request) {
  try {
    if (!isAuthorizedCronRequest(req)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const admin = await getSupabaseAdmin();
    const stripe = getStripe();

    if (!stripe) {
      return Response.json(
        { error: "Stripe is not configured." },
        { status: 500 },
      );
    }

    const nowIso = new Date().toISOString();

    const { data: pausedRows, error: pausedError } = await admin
      .from("subscriptions")
      .select(
        `
        id,
        user_id,
        listing_id,
        purpose_sub,
        product_name,
        price_id,
        quantity,
        pause_status,
        pause_ends_at,
        last_pause_resumed_at
      `,
      )
      .eq("pause_status", "active")
      .lte("pause_ends_at", nowIso)
      .is("last_pause_resumed_at", null)
      .or("purpose_sub.is.null,purpose_sub.neq.listing_promo");

    if (pausedError) {
      throw new Error(`Failed loading expired pauses: ${pausedError.message}`);
    }

    let resumed = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of (pausedRows ?? []) as PausedSubscriptionRow[]) {
      try {
        if (!row.price_id) {
          console.warn(
            `[pause-auto-resume] Missing price_id for paused subscription ${row.id}; skipping.`,
          );
          skipped += 1;
          continue;
        }

        const { data: customerMap, error: customerMapError } = await admin
          .from("customers")
          .select("stripe_customer_id")
          .eq("id", row.user_id)
          .maybeSingle();

        if (customerMapError) {
          throw new Error(
            `Failed loading Stripe customer for user ${row.user_id}: ${customerMapError.message}`,
          );
        }

        const stripeCustomerId = customerMap?.stripe_customer_id ?? null;

        if (!stripeCustomerId) {
          console.warn(
            `[pause-auto-resume] No stripe_customer_id found for paused subscription ${row.id}; skipping.`,
          );
          skipped += 1;
          continue;
        }

        const { data: relatedRows, error: relatedRowsError } = await admin
          .from("subscriptions")
          .select(
            `
            id,
            listing_id,
            purpose_sub,
            product_name,
            status
          `,
          )
          .eq("user_id", row.user_id)
          .neq("id", row.id);

        if (relatedRowsError) {
          throw new Error(
            `Failed loading related rows for ${row.id}: ${relatedRowsError.message}`,
          );
        }

        const liveReplacementAlreadyExists = (relatedRows ?? []).some(
          (candidate) => {
            const typedCandidate = candidate as RelatedSubscriptionRow;
            return (
              sameLogicalContext(typedCandidate, row) &&
              isLiveStatus(typedCandidate.status)
            );
          },
        );

        if (liveReplacementAlreadyExists) {
          await admin
            .from("subscriptions")
            .update({
              last_pause_resumed_at: nowIso,
            })
            .eq("id", row.id);

          skipped += 1;
          continue;
        }

        const reusablePaymentMethodId = await resolveReusablePaymentMethodId({
          stripe,
          pausedSubscriptionId: row.id,
          stripeCustomerId,
        });

        if (!reusablePaymentMethodId) {
          console.warn(
            `[pause-auto-resume] No reusable payment method found for paused subscription ${row.id}; leaving it paused.`,
          );
          skipped += 1;
          continue;
        }

        const newSub = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [
            {
              price: row.price_id,
              quantity: row.quantity ?? 1,
            },
          ],
          default_payment_method: reusablePaymentMethodId,
          metadata: {
            auto_resume_from_pause: "true",
            resumed_from_subscription_id: row.id,
            supabase_user_id: row.user_id,
            listing_id: row.listing_id ?? "",
            purpose_sub: row.purpose_sub ?? "",
          },
        });

        await admin
          .from("subscriptions")
          .update({
            last_pause_resumed_at: nowIso,
          })
          .eq("id", row.id);

        console.log(
          `[pause-auto-resume] Created new Stripe subscription ${newSub.id} from paused subscription ${row.id}`,
        );

        resumed += 1;
      } catch (rowError) {
        failed += 1;
        console.error(
          `[pause-auto-resume] Failed for paused subscription ${row.id}:`,
          rowError,
        );
      }
    }

    return Response.json({
      ok: true,
      resumed,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("[pause-auto-resume] Fatal error:", error);

    return Response.json(
      { error: "Failed to process automatic pause resumes." },
      { status: 500 },
    );
  }
}
