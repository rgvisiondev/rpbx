// app/(member)/dashboard/_components/MatchedBusinesses.tsx
import Image from "next/image";
import Link from "next/link";
import Button from "@/app/components/Button";
import { imageUrl } from "@/lib/industryImages";
import type { BusinessMatch } from "@/lib/matching/matchListings";

export default function MatchedBusinesses({
  matches,
}: {
  matches: BusinessMatch[];
}) {
  if (!matches?.length) {
    return <p>No matches yet — check back soon.</p>;
  }

  const isFallback =
    matches.length > 0 && matches.every((m) => m._source === "newest");

  return (
    <>
      {isFallback && (
        <div className="col-span-full mb-2 text-sm text-neutral-700">
          There are no direct matches yet, but check out these businesses:
        </div>
      )}

      {matches.map((l) => {
        const imgSrc =
          (l.listing_image_choice && imageUrl(l.listing_image_choice)) ||
          "/images/businesses/home-services.jpg";

        const alt =
          l.listing_image_alt ||
          l.title ||
          "Business listing thumbnail";

        const location = [l.city, l.county]
          .filter(Boolean)
          .join(", ");

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
            />
            <div className="bg-white p-5 rounded-b-lg shadow-lg border-x-2 border-b-2 border-gray-200">

              <p className="font-semibold">
                {l.industry ?? "—"} Business
              </p>

              {location && (
                <p className="mt-1 text-xs text-neutral-600">
                  {location}
                </p>
              )}

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
