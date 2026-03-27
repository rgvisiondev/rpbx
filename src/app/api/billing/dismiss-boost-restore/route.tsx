import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createClientRSC } from "../../../../../utils/supabase/server";

export const runtime = "nodejs";

type DismissBoostRestoreRequestBody = {
  subscriptionId?: string;
};

type MainSubscriptionRecord = {
  id: string;
  user_id: string;
};

export async function POST(req: Request) {
  try {
    const supabase = await createClientRSC();
    const admin = await getSupabaseAdmin();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = (await req.json()) as DismissBoostRestoreRequestBody;
    const subscriptionId = body?.subscriptionId?.trim();

    if (!subscriptionId) {
      return Response.json(
        { error: "subscriptionId is required." },
        { status: 400 },
      );
    }

    const subResult = await admin
      .from("subscriptions")
      .select("id, user_id")
      .eq("id", subscriptionId)
      .single();

    const sub = (subResult.data as MainSubscriptionRecord | null) ?? null;

    if (subResult.error || !sub) {
      return Response.json(
        { error: "Subscription not found." },
        { status: 404 },
      );
    }

    if (sub.user_id !== user.id) {
      return Response.json(
        { error: "You do not have access to this subscription." },
        { status: 403 },
      );
    }

    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        paused_boost_restore_dismissed_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (updateError) {
      throw new Error(
        `Error dismissing boost restore prompt: ${updateError.message}`,
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error dismissing boost restore prompt:", error);

    return Response.json(
      { error: "Failed to dismiss boost restore prompt." },
      { status: 500 },
    );
  }
}