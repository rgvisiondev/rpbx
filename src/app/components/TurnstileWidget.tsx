// app/components/TurnstileWidget.tsx
"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type TurnstileTheme = "light" | "dark" | "auto";
type TurnstileSize = "normal" | "compact" | "invisible";

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  action?: string;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
  execution?: "render" | "execute";
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
      execute?: (widgetId: string) => void;
    };
  }
}

export type TurnstileHandle = {
  execute: () => Promise<void>;
  reset: () => void;
};

type Props = {
  action?: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  theme?: TurnstileTheme;
};

export const TurnstileWidget = forwardRef<TurnstileHandle, Props>(
  ({ action = "form_submit", onVerify, onError, theme = "auto" }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const hasExecutedRef = useRef(false);

    // Keep latest callbacks without re-rendering the widget
    const onVerifyRef = useRef(onVerify);
    const onErrorRef = useRef(onError);
    
    useEffect(() => {
      onVerifyRef.current = onVerify;
      onErrorRef.current = onError;
    }, [onVerify, onError]);

    useEffect(() => {
      const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
      if (!siteKey) {
        console.warn("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
        return;
      }

      let cancelled = false;

      const render = () => {
        if (cancelled) return;
        if (!containerRef.current) return;
        if (!window.turnstile) return;
        if (widgetIdRef.current) return;

        // CRITICAL FIX: Use execution: "execute" mode
        // This prevents auto-execution on render
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme,
          size: "normal",
          execution: "execute", // KEY CHANGE: Manual execution mode
          callback: (token) => {
            // Only call onVerify if this was triggered by explicit execute()
            if (hasExecutedRef.current) {
              onVerifyRef.current(token);
              hasExecutedRef.current = false;
            }
          },
          "error-callback": () => {
            onErrorRef.current?.();
            hasExecutedRef.current = false;
            if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
          },
          "expired-callback": () => {
            hasExecutedRef.current = false;
            if (widgetIdRef.current) window.turnstile?.reset(widgetIdRef.current);
          },
        });
      };

      // Wait for Turnstile script (loaded globally in layout)
      const iv = window.setInterval(() => {
        if (window.turnstile) {
          window.clearInterval(iv);
          render();
        }
      }, 50);

      return () => {
        cancelled = true;
        window.clearInterval(iv);
        if (widgetIdRef.current && window.turnstile?.remove) {
          window.turnstile.remove(widgetIdRef.current);
        }
        widgetIdRef.current = null;
        hasExecutedRef.current = false;
      };
    }, [action, theme]);

    useImperativeHandle(ref, () => ({
      execute: async () => {
        const id = widgetIdRef.current;
        if (!id || !window.turnstile?.execute) {
          // Script not ready yet
          onErrorRef.current?.();
          return;
        }
        
        // Mark that we're executing so callback knows to fire
        hasExecutedRef.current = true;
        window.turnstile.execute(id);
      },
      reset: () => {
        const id = widgetIdRef.current;
        hasExecutedRef.current = false;
        if (id && window.turnstile?.reset) window.turnstile.reset(id);
      },
    }));

    // This div must exist for explicit render
    return <div ref={containerRef} />;
  }
);

TurnstileWidget.displayName = "TurnstileWidget";