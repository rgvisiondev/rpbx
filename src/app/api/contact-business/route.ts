import { Resend } from "resend";
import { verifyTurnstileToken } from "@/lib/verifyTurnstile";
import ContactBusiness from "@/emails/ContactBusiness";
import { render } from "@react-email/components";

const resend = new Resend(process.env.RESEND_API_KEY);
const from = process.env.EMAIL_FROM ?? "RioPlex <info@rioplexbizx.com>";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessEmail,
      businessName,
      investorName,
      investorOrganization,
      investorIndustry,
      investorLocation,
      contactEmail,
      contactPhone,
      message,
      turnstileToken,
    } = body;

    // Validate required fields
    if (!businessEmail || !contactEmail || !message || !turnstileToken) {
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
      ContactBusiness({
        businessName,
        investorName,
        investorOrganization,
        investorIndustry,
        investorLocation,
        contactEmail,
        contactPhone,
        message,
      })
    );

    // Send email using Resend
    await resend.emails.send({
      from,
      to: businessEmail,
      subject: `New Investor Inquiry${investorOrganization ? ` from ${investorOrganization}` : investorName ? ` from ${investorName}` : ""}`,
      html: emailHtml,
      replyTo: contactEmail,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("/api/contact-business error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
