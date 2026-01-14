import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import ContactInvestor from "@/emails/ContactInvestor";
import { render } from "@react-email/components";
import { getEmailFrom, getResendClient } from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const resend = getResendClient();
    const from = getEmailFrom();

    const body = await req.json();
    const {
      investorEmail,
      investorName,
      businessName,
      industry,
      location,
      businessDescription,
      contactEmail,
      contactPhone,
      message,
      turnstileToken,
    } = body;

    // Validate required fields
    if (!investorEmail || !contactEmail || !message || !turnstileToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify Turnstile token
    const ok = await verifyTurnstileToken(turnstileToken);
    if (!ok) {
      return new Response(
        JSON.stringify({ error: "Failed human verification." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Render the email template
    const emailHtml = await render(
      ContactInvestor({
        investorName,
        businessName,
        industry,
        location,
        businessDescription,
        contactEmail,
        contactPhone,
        message,
      })
    );

    // Send email using Resend
    await resend.emails.send({
      from,
      to: investorEmail,
      subject: `New Business Inquiry${businessName ? ` from ${businessName}` : ""}`,
      html: emailHtml,
      replyTo: contactEmail,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("/api/contact-investor error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
