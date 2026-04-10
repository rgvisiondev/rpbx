// app/api/valuations/free/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import ValuationEmail from "../../../../../emails/ValuationEmail";
import {
  BIZEQUITY_VALUATION_LINK,
  VALUATION_CALENDLY_LINK,
} from "@/lib/valuation-config";
import { getResendClient, getEmailFrom } from "@/lib/resend";

type RequestBody = {
  fullName?: string;
  email?: string;
  sourcePage?: string;
  turnstileToken?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyTurnstileToken(token: string, ip?: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    throw new Error("Turnstile secret key is not configured.");
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);

  if (ip) {
    formData.append("remoteip", ip);
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();
  return Boolean(data.success);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const sourcePage = body.sourcePage?.trim() || "unknown";
    const turnstileToken = body.turnstileToken?.trim();

    if (!fullName) {
      return NextResponse.json(
        { error: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!turnstileToken) {
      return NextResponse.json(
        { error: "Please complete the verification step and try again." },
        { status: 400 }
      );
    }

    if (!BIZEQUITY_VALUATION_LINK) {
      return NextResponse.json(
        { error: "The valuation link is not configured." },
        { status: 500 }
      );
    }

    if (!VALUATION_CALENDLY_LINK) {
      return NextResponse.json(
        { error: "The consultation link is not configured." },
        { status: 500 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const remoteIp = forwardedFor?.split(",")[0]?.trim() ?? null;

    const turnstileValid = await verifyTurnstileToken(
      turnstileToken,
      remoteIp
    );

    if (!turnstileValid) {
      return NextResponse.json(
        { error: "Verification failed. Please try again." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration is incomplete." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: savedLead, error: saveErr } = await supabase
      .from("valuation_leads")
      .upsert(
        {
          full_name: fullName,
          email,
          source_page: sourcePage,
          source_path: request.headers.get("referer") || null,
          campaign: "free_valuation",
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (saveErr) {
      console.error("Failed to save valuation lead:", saveErr);
      return NextResponse.json(
        { error: "We couldn’t start your valuation right now. Please try again." },
        { status: 500 }
      );
    }

    const resend = getResendClient();

    const emailResult = await resend.emails.send({
      from: getEmailFrom(),
      to: email,
      subject: "Your free RioPlex business valuation link",
      react: ValuationEmail({
        link: BIZEQUITY_VALUATION_LINK,
        calendlyLink: VALUATION_CALENDLY_LINK,
        mode: "free",
        fullName,
      }),
    });

    if ("error" in emailResult && emailResult.error) {
      console.error("Failed to send valuation email:", emailResult.error);

      await supabase
        .from("valuation_leads")
        .update({
          email_error: emailResult.error.message || "Unknown resend error",
        })
        .eq("id", savedLead.id);

      return NextResponse.json(
        {
          error:
            "We received your request, but couldn’t send the valuation email just yet. Please try again.",
        },
        { status: 500 }
      );
    }

    await supabase
      .from("valuation_leads")
      .update({
        email_sent_at: new Date().toISOString(),
        resend_email_id:
          "data" in emailResult ? emailResult.data?.id || null : null,
        email_error: null,
      })
      .eq("id", savedLead.id);

    return NextResponse.json({
      ok: true,
      redirectUrl: BIZEQUITY_VALUATION_LINK,
      message: "Your valuation link is on the way to your inbox.",
    });
  } catch (error) {
    console.error("Free valuation route error:", error);

    return NextResponse.json(
      {
        error:
          "Something went wrong while starting your valuation. Please try again.",
      },
      { status: 500 }
    );
  }
}