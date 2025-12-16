"use client";

import { useEffect } from "react";

export function AdsSubscribeConversion({
  sessionId,
}: {
  sessionId: string;
}) {
  useEffect(() => {
    const key = `gads_subscribe_${sessionId}`;

    // Prevent double firing on refresh
    if (localStorage.getItem(key)) return;

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "conversion", {
        send_to: "AW-17790035839/DGPOCPLrsc4bEP_O-aJC",
        value: 1.0,
        currency: "USD",
        transaction_id: sessionId, // Google Ads deduplication
      });

      localStorage.setItem(key, "1");
    }
  }, [sessionId]);

  return null;
}
