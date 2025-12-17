"use client";

import { useEffect, useRef } from "react";

type TurnstileTheme = "light" | "dark" | "auto";
type TurnstileSize = "normal" | "compact" | "invisible";

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  action?: string;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
  // Optional extras Turnstile supports (safe to keep typed + optional)
  appearance?: "always" | "execute" | "interaction-only";
  language?: string;
  retry?: "auto" | "never";
  "retry-interval"?: number;
  "refresh-expired"?: "auto" | "manual" | "never";
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string; // returns widgetId
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
      execute?: (widgetId: string) => void;
    };
  }
}

type Props = {
  onVerify: (token: string) => void;
  action?: string;
};

export function TurnstileWidget({ onVerify, action }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.warn("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
      return;
    }

    const renderOnce = () => {
      const container = containerRef.current;
      const ts = window.turnstile;
      if (!container || !ts) return;
      if (widgetIdRef.current) return; // prevents double render

      widgetIdRef.current = ts.render(container, {
        sitekey: siteKey,
        callback: (token) => onVerify(token),
        action: action ?? "form_submit",
        theme: "auto",
        size: "invisible",
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
    );

    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      s.async = true;
      s.defer = true;
      s.onload = () => {
        scriptLoadedRef.current = true;
        renderOnce();
      };
      document.head.appendChild(s);
    } else {
      if (window.turnstile) renderOnce();
      else if (!scriptLoadedRef.current) {
        existing.addEventListener("load", renderOnce, { once: true });
      }
    }

    return () => {
      const id = widgetIdRef.current;
      if (id && window.turnstile?.remove) {
        window.turnstile.remove(id);
      }
      widgetIdRef.current = null;
    };
  }, [onVerify, action]);

  return <div ref={containerRef} />;
}
