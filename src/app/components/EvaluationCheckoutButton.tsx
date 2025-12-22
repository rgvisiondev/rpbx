// app/components/EvaluationCheckoutButton.tsx
"use client";

import { useState } from "react";
import Button from "./Button";

export default function EvaluationCheckoutButton({ color, variant }: { color?: "white" | "green"; variant?: "text" }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout/evaluation-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      const message =
        err instanceof Error ? err.message : "Failed to redirect to checkout";
      setError(message);
      setLoading(false);
    }
  };

  if (variant === "text") {
    return (
      <>
        {error && (
          <p className="text-red-500 mb-2 text-sm">{error}</p>
        )}
        <button 
          onClick={handleCheckout}
          disabled={loading}
          className="text-sm font-bold text-white underline underline-offset-8 hover:text-[#60BC9B] transition mt-4 lg:mt-0 hover:cursor-pointer disabled:opacity-50"
        >
          {loading ? "Redirecting..." : "Buy now without membership →"}
        </button>
      </>
    );
  }

  return (
    <>
      {error && (
        <p className="text-red-500 mb-2 text-sm">{error}</p>
      )}
      <Button
        onClick={handleCheckout}
        disabled={loading}
        className={color === "white" ? "mt-3 lg:mt-3 w-full sm:w-auto" : "mb-10 w-full max-w-[1000px]"}
        variant={color === "white" ? "white" : undefined}
      >
        {loading ? "Redirecting..." : "Get My Valuation"}
      </Button>
    </>
  );
}