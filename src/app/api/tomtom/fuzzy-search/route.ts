// app/api/tomtom/fuzzy-search/route.ts
import { NextRequest, NextResponse } from "next/server";

const TOMTOM_API_KEY = process.env.TOMTOM_API_KEY;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") || "";
    const limit = searchParams.get("limit") || "5";

    if (!TOMTOM_API_KEY) {
      console.error("Missing TOMTOM_API_KEY env var");
      return NextResponse.json(
        { error: "Server misconfiguration" },
        { status: 500 }
      );
    }

    // Avoid hammering TomTom on 1–2 character input
    if (!q || q.trim().length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    const baseUrl = "https://api.tomtom.com/search/2/search";
    const url = new URL(
      `${baseUrl}/${encodeURIComponent(q)}.json`
    );

    url.searchParams.set("key", TOMTOM_API_KEY);
    url.searchParams.set("typeahead", "true");
    url.searchParams.set("limit", limit);
    url.searchParams.set("countrySet", "US"); // <- adjust if you support more
    url.searchParams.set("language", "en-US");

    // OPTIONAL: You could also add lat/lon biasing here if you
    // have a notion of user's general area:
    // const lat = searchParams.get("lat");
    // const lon = searchParams.get("lon");
    // if (lat && lon) {
    //   url.searchParams.set("lat", lat);
    //   url.searchParams.set("lon", lon);
    // }

    const res = await fetch(url.toString());

    if (!res.ok) {
      console.error("TomTom fuzzy search error:", res.status, await res.text());
      return NextResponse.json({ suggestions: [] }, { status: 200 });
    }

    const data = await res.json();

    const suggestions = (data.results ?? []).map((r: any) => ({
      id: r.id,
      address: r.address?.freeformAddress ?? "",
      city: r.address?.municipality ?? null,
      county: r.address?.countrySecondarySubdivision ?? null,
      stateCode: r.address?.countrySubdivisionCode ?? null,
      postalCode: r.address?.postalCode ?? null,
      lat: r.position?.lat ?? null,
      lon: r.position?.lon ?? null,
    }));

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("TomTom fuzzy search exception:", err);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
