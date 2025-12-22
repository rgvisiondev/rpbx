// app/TurnstileScript.tsx
"use client";
import Script from "next/script";

export default function TurnstileScript() {
  return (
    <Script
      id="cf-turnstile"
      src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
      strategy="afterInteractive"
    />
  );
}
