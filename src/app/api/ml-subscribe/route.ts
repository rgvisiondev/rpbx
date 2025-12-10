import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, groups } = (await request.json()) as {
      email?: string;
      groups?: string[];
    };

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const apiKey = process.env.NEWSLETTER_NON_MEMBERS_API_KEY;
    if (!apiKey) {
      console.error("Missing NEWSLETTER_NON_MEMBERS_API_KEY");
      return NextResponse.json(
        { error: "Newsletter service not configured" },
        { status: 500 }
      );
    }

    const groupArray =
      Array.isArray(groups) && groups.length > 0
        ? groups
        : ["172616011480041008"]; // Default group

    const res = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        groups: groupArray,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("MailerLite Error:", res.status, text);

      // Optional: treat "already subscribed" as success
      if (res.status === 409 || text.toLowerCase().includes("already")) {
        return NextResponse.json({ success: true });
      }

      return NextResponse.json({ error: "MailerLite error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
