"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function AdsSubscribeConversion({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    if (!sessionId) return;

    const key = `gads_subscribe_${sessionId}`;

    try {
      if (localStorage.getItem(key)) return;
    } catch {
      // If localStorage is blocked, still allow the conversion event to fire.
    }

    window.dataLayer = window.dataLayer || [];

    window.dataLayer.push({
      event: "rpbx_signup_success",
      conversion_name: "Sign-up",
      conversion_source: "activate_page",
      transaction_id: sessionId,
      value: 1.0,
      currency: "USD",
    });

    try {
      localStorage.setItem(key, "1");
    } catch {
      // Ignore storage errors.
    }
  }, [sessionId]);

  return null;
}