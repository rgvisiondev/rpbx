// app/dashboard/_components/BusinessCards.tsx
import Image from "next/image";

type Listing = {
  id: string;
  title?: string | null;
  industry?: string | null;
};

export default function MatchedBusinesses({ matches }: { matches: Listing[] }) {
  if (!matches?.length) return <p>No matches yet — check back soon.</p>;

  return (
    <>
      {matches.map((l) => (
        <div key={l.id} className="flex-1 ">
          <Image
            src="/images/test/chen-lee.png"
            alt="Business Thumbnail"
            className="rounded-t-lg w-full shadow-lg border-x-2 border-t-2 border-gray-200"
            width={200}
            height={100}
          />
          <div className="bg-[#F3F3F3] p-5 rounded-b-lg shadow-lg border-x-2 border-b-2 border-gray-200">
            <h4>{l.title ?? "Untitled Listing"}</h4>
            <p className="italic">{l.industry ?? "—"}</p>
            <button className="mt-3 w-full rounded-lg bg-black text-white py-2">View Listing</button>
          </div>
        </div>
      ))}
    </>
  );
}
