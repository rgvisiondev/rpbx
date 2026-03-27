import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import ContactAdvisor from "../../../../emails/ContactAdvisor";
import { render } from "@react-email/components";
import { getEmailFrom, getResendClient } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const resend = getResendClient();
    const from = getEmailFrom();
    const body = await req.json();
    const { to, subject, advisorName, contactEmail, contactPhone, message, turnstileToken } = body;

    if (!to || !subject || !contactEmail || !message || !turnstileToken) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const ok = await verifyTurnstileToken(turnstileToken);
    if (!ok) {
      return new Response(
        JSON.stringify({ error: "Failed human verification." }),
        { status: 400 }
      );
    }

    // Render the email template
    const emailHtml = await render(
      ContactAdvisor({
        advisorName,
        contactEmail,
        contactPhone,
        message,
      })
    );

    await resend.emails.send({
      from,
      to,
      subject,
      html: emailHtml,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("/api/contact-email error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
