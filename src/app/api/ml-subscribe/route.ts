import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, groups } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    // Ensure "groups" is a valid array or fallback to your default MailerLite group
    const groupArray = Array.isArray(groups) && groups.length > 0
      ? groups
      : ["172616011480041008"]; // Default group

    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEWSLETTER_NON_MEMBERS_API_KEY}`,
      },
      body: JSON.stringify({
        email,
        groups: groupArray,
      }),
    });

    // Error handling for MailerLite API
    if (!res.ok) {
      const text = await res.text();
      console.error("MailerLite Error:", text);
      return NextResponse.json({ error: "MailerLite error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
