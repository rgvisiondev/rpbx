"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PromotePage() {
  const [listingId, setListingId] = useState("");
  const router = useRouter();

  async function startCheckout() {
    if (!listingId) return;
    const res = await fetch("/api/checkout/boost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        listingId,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BOOST, // expose publishable or map server-side if you prefer
      }),
    });
    const { url, error } = await res.json();
    if (error) alert(error);
    else router.push(url);
  }

  // Optional: fetch+render user listings for selection (omitted for brevity)
  return (
    <div className="w-full lg:w-[1140px] mx-auto py-10 px-5">
      <h1>Promote a Listing</h1>
      <p className="mb-4">Choose a listing to boost. This creates a Stripe subscription tied to that listing.</p>
      <input
        className="border p-2 rounded w-full max-w-md"
        placeholder="Listing ID..."
        value={listingId}
        onChange={e => setListingId(e.target.value)}
      />
      <button onClick={startCheckout} className="mt-3 px-4 py-2 rounded bg-black text-white">
        Start Checkout
      </button>
    </div>
  );
}
