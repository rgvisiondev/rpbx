// app/dashboard/_components/MatchedInvestors.tsx
import Image from "next/image";
import Link from "next/link";
import Button from "@/app/components/Button";
import { createClientRSC } from "@/../utils/supabase/server";

type InvestorMatch = {
  id: string;
  primary_industry?: string | null;
  _source?: "matched" | "newest";
  avatar_path?: string | null;   // e.g. "9580fa12-.../avatar.jpeg"
  first_name?: string | null;
  last_name?: string | null;
  score?: number;
};

type WithSigned = InvestorMatch & { avatar_url: string | null };

// mark async so we can await signing
export default async function MatchedInvestors({ matches }: { matches: InvestorMatch[] }) {
  if (!matches?.length) return <p>No matches yet — check back soon.</p>;

  const isFallback = matches.every((m) => m._source === "newest");
  const supabase = await createClientRSC();

  // Sign each unique storage path once (nice for perf)
  const paths = matches.map(m => (m.avatar_path ?? "").replace(/^\/+/, "")).filter(Boolean);
  const unique = Array.from(new Set(paths));

  const signedMap = new Map<string, string>();
  await Promise.all(
    unique.map(async (p) => {
      const { data } = await supabase.storage.from("investors").createSignedUrl(p, 600); // 10 min
      if (data?.signedUrl) signedMap.set(p, data.signedUrl);
    })
  );

  const items: WithSigned[] = matches.map((m) => {
    const path = (m.avatar_path ?? "").replace(/^\/+/, "");
    return { ...m, avatar_url: path ? signedMap.get(path) ?? null : null };
  });

  return (
    <>
      {isFallback && (
        <div className="col-span-full mb-2 text-sm text-neutral-700">
          There are no matches yet, but check out these great investors:
        </div>
      )}

      {items.map((m) => {
        const name =
          [m.first_name ?? "", m.last_name ?? ""].join(" ").trim() ||
          `Investor #${m.id.slice(0, 6)}`;

        const imgSrc = m.avatar_url || "/images/svg/def-inv.svg";

        return (
          <div key={m.id} className="flex-1">
            <Image
              src={imgSrc}
              alt={`${name}'s profile photo`}
              className="bg-gray-200 rounded-t-lg w-full shadow-lg border-x-2 border-t-2 border-gray-200 object-cover h-[220px]"
              width={400}
              height={220}
              loading="lazy"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 100vw"
              // Remove this once you've whitelisted your Supabase host in next.config.(t|j)s
              unoptimized
            />
            <div className="bg-white p-5 rounded-b-lg shadow-lg border-x-2 border-b-2 border-grey-200">
              <h4 className="font-semibold">{name}</h4>
              <p className="italic">{m.primary_industry ?? "—"}</p>
              <Link href={`/investor-listing/${m.id}`}>
                <Button className="mt-4 w-full">View Profile</Button>
              </Link>
            </div>
          </div>
        );
      })}
    </>
  );
}
