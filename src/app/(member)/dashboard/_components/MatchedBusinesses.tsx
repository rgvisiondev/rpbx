// app/(member)/dashboard/_components/MatchedBusinesses.tsx
import Image from "next/image";
import Link from "next/link";
import Button from "@/app/components/Button";
import { createClientRSC } from "@/../utils/supabase/server";
import type { Database } from "@/types/database.types";

type Listing = Database["public"]["Tables"]["business_listings"]["Row"];

// Adjust to your actual bucket name for listing images
const LISTING_BUCKET = "business-listings";

export default async function MatchedBusinesses({
  matches,
}: {
  matches: Listing[];
}) {
  if (!matches?.length) {
    return <p>No matches yet — check back soon.</p>;
  }

  const supabase = await createClientRSC();

  // Sign each unique storage path once
  const paths = matches
    .map((l) => (l.listing_image_path ?? "").replace(/^\/+/, ""))
    .filter(Boolean);
  const unique = Array.from(new Set(paths));

  const signedMap = new Map<string, string>();
  await Promise.all(
    unique.map(async (p) => {
      const { data } = await supabase.storage
        .from(LISTING_BUCKET)
        .createSignedUrl(p, 600); // 10 minutes
      if (data?.signedUrl) signedMap.set(p, data.signedUrl);
    })
  );

  return (
    <>
      {matches.map((l) => {
        const imgPath = (l.listing_image_path ?? "").replace(/^\/+/, "");
        const imgSrc =
          (imgPath && signedMap.get(imgPath)) ||
          "/images/businesses/home-services.jpg"; // fallback

        const alt =
          l.listing_image_alt ||
          l.title ||
          "Business listing thumbnail";

        return (
          <div key={l.id} className="flex-1">
            <Image
              src={imgSrc}
              alt={alt}
              className="rounded-t-lg w-full shadow-lg border-x-2 border-t-2 border-gray-200 object-cover h-[220px]"
              width={400}
              height={220}
              loading="lazy"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
              // Remove once your Supabase host is whitelisted in next.config
              unoptimized
            />
            <div className="bg-white p-5 rounded-b-lg shadow-lg border-x-2 border-b-2 border-gray-200">
              <h4 className="font-semibold line-clamp-2">
                {l.title ?? "Untitled Listing"}
              </h4>

              <p className="italic text-sm text-neutral-700">
                {l.industry ?? "—"}
              </p>

              {l.location_city || l.county ? (
                <p className="mt-1 text-xs text-neutral-600">
                  {[l.location_city, l.county].filter(Boolean).join(", ")}
                </p>
              ) : null}

              <Link href={`/business-listing/${l.id}`}>
                <Button className="mt-4 w-full">View Listing</Button>
              </Link>
            </div>
          </div>
        );
      })}
    </>
  );
}
