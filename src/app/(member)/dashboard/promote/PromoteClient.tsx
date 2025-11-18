"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PromoteClient() {
  const [listingId, setListingId] = useState("");
  const router = useRouter();

  async function startCheckout() {
    if (!listingId) return;

    const res = await fetch("/api/checkout/boost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        listingId,
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BOOST,
      }),
    });

    const { url, error } = await res.json();
    if (error) alert(error);
    else router.push(url);
  }

  return (
    <div>
      <input
        className="border p-2 rounded w-full max-w-md bg-white"
        placeholder="Listing ID..."
        value={listingId}
        onChange={(e) => setListingId(e.target.value)}
      />

      <button
        onClick={startCheckout}
        className="mt-3 px-4 py-2 rounded bg-black text-white"
      >
        Start Checkout
      </button>
    </div>
  );
}
