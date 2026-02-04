import { NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import { syncMailerLiteGroups } from "@/lib/mailerlite/mailerlite";

export async function POST(request: Request) {
  try {
    const { name, email, turnstileToken } = await request.json();

    if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
    if (!turnstileToken)
      return NextResponse.json({ error: "Missing TurnstileToken" }, { status: 400 });

    const ok = await verifyTurnstileToken(turnstileToken);
    if (!ok) {
      return NextResponse.json({ error: "Failed human verification." }, { status: 400 });
    }

    try {
      await syncMailerLiteGroups(email, null, name, "newsletter");
    } catch (e) {
      console.error("[MailerLite] Public signup sync failed", e);
      // still return success
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
