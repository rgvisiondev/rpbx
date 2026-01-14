import { getEmailFrom, getResendClient } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const resend = getResendClient();
    const from = getEmailFrom();
    const body = await req.json();
    const { to, subject, html } = body as {
      to?: string;
      subject?: string;
      html?: string;
    };

    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("/api/send-email error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
