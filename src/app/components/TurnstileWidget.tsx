"use client";

import {useEffect, useRef} from "react";

type TurnstileRenderOptions = {
    sitekey: string | undefined;
    callback: (token: string) => void;
    action?: string;
    theme?: "light" | "dark" | "auto";
    size?: "normal" | "compact" | "invisible"
};

declare global {
    interface Window {
        onTurnstileSuccess?: (token: string) => void;
        turnstile?: {
            render: (container: HTMLElement, options: TurnstileRenderOptions) => void;
            reset: (widgetId?: string) => void;
        };
    }
}

type TurnstileWidgetProps = {
    onVerify: (token: string) => void;
    action?: string; // "newsletter" or "advisor_contact"
}

export function TurnstileWidget({ onVerify, action }: TurnstileWidgetProps){

    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {

        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

        if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY){
            console.warn("NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set");
            return;
        }

        window.onTurnstileSuccess = (token: string) => {
            onVerify(token);
        };

        const existingScript = document.querySelector<HTMLScriptElement>(
            `script[src="https://challenges.cloudflar.com/turnstile/v0/api.js"]`
        );

        const renderWidget = () => {
            if (!containerRef.current || !window.turnstile) return;

            window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => {
                    onVerify(token);
                },
                action: action ?? "form_submit",
                theme: "auto",
                size: "invisible",
            });
        };

        if (!existingScript){
            const script = document.createElement("script");
            script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
            script.async = true;
            script.defer = true;
            script.onload = renderWidget;
            document.head.appendChild(script);
        } else {
            if (window.turnstile) {
                renderWidget();
            } else {
                existingScript.addEventListener("load", renderWidget, { once: true});
            }
        }

        return () => {
            if (window.onTurnstileSuccess){
                delete window.onTurnstileSuccess;
            }
        };
    }, [onVerify, action]);


    return <div ref={containerRef} />;


}