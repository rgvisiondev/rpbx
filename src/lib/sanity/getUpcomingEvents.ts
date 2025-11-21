import { groq } from "next-sanity";
import { eventClient } from "@/sanity/client";

// Matches your schema: you have `date` (datetime), not `startAt`
const RAW_EVENTS = groq`*[_type == "event"] | order(date asc)[0...25]{
  _id,
  title,
  "slug": coalesce(slug.current, slug, _id),
  // If time wasn't set, this will still be a valid ISO datetime string at 00:00
  date,
  // Your schema uses string for location, so we just take it directly
  location
}`;

export type EventItem = {
  _id?: string;
  title: string;
  slug: string;
  date: string; // ISO
  location?: string | null;
  url?: string; // for convenience in UI
};

export async function getUpcomingEvents(): Promise<EventItem[]> {
  const data = await eventClient.fetch<
    Array<{ _id?: string; title?: string; slug?: string; date?: string; location?: string }>
  >(RAW_EVENTS);

  const today = new Date();
  // Normalize to **start of local day** so “today” events show up even if time was left blank
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  // Filter in JS so “today at 00:00” isn’t excluded
  const filtered = (data ?? []).filter((e) => {
    const t = e?.date ? new Date(e.date).getTime() : 0;
    return t >= startOfToday; // include today and future
  });

  // Map + pick top 3
  const items: EventItem[] = filtered.slice(0, 3).map((e) => ({
    _id: e._id,
    title: e.title ?? "Untitled Event",
    slug: e.slug ?? "",
    date: e.date ?? new Date().toISOString(),
    location: e.location ?? null,
    // if you have a Next route `/events/[slug]`
    url: e.slug ? `/events/${e.slug}` : undefined,
  }));

  // DEV-ONLY: if nothing came back, log first 5 raw so you can sanity-check drafts/dataset/timestamps
  if (process.env.NODE_ENV !== "production" && items.length === 0) {
    // eslint-disable-next-line no-console
    console.warn("[Sanity] No upcoming events after filter. First 5 raw:", (data ?? []).slice(0, 5));
  }

  return items;
}
