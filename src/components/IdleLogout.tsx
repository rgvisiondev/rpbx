"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const IDLE_MS = 20 * 60 * 1000; // 20 minutes
const CHECK_EVERY_MS = 15 * 1000 // 15s
const DEBOUNCE_ACTIVITY_MS = 5 * 1000 // dont spam pings

const LS_KEY = "rpbx_last_activity";

function getSupabaseBrowser(){
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}

export function IdleLogout() {

    const router = useRouter();

    //keep the broswer client in ref so dont re-create on renders.
    const supabaseRef = useRef<ReturnType<typeof getSupabaseBrowser> | null>(null);
    if (!supabaseRef.current) supabaseRef.current = getSupabaseBrowser();

    //prevent multiple logout attempts firing at once
    const logoutRef = useRef(false);

    //used to debouce server ping
    const lastPingRef = useRef(0);

    const markActivity = () => {
        const now = Date.now();

        // localStorage timestamp: for fast client-side checks + cross-tab sharing
        localStorage.setItem(LS_KEY, String(now));

        // ping server to set httpOnly cookie for middleware / server enforcement
        // debounce so we dont call this on every mousemove
        if (now - lastPingRef.current < DEBOUNCE_ACTIVITY_MS) return;
        lastPingRef.current = now;

        fetch("/api/auth/activity", { method: "POST" }).catch(() => {});
    };

    const doLogout = async () => {
        if (logoutRef.current) return;
        logoutRef.current = true;

        try {
            // clears current session on the client and storage
            await supabaseRef.current!.auth.signOut();
        } finally {
            router.replace("/login?reason=inactive");
        }
    };

    useEffect(() => {
        //Initialize last activity on mount
        const initial = Number(localStorage.getItem(LS_KEY) || "0");
        if (!initial) {
            markActivity();
        }

        // Treat real users interactions as "activity"
        const events: Array<keyof WindowEventMap> = [
            "mousemove",
            "mousedown",
            "keydown",
            "scroll",
            "touchstart",
            "click"
        ];

        const onActivity = () => {
            //only count activity if tab is visible
            if (document.visibilityState === "visible") markActivity();
        };

        events.forEach((e) => window.addEventListener(e, onActivity, { passive: true}));

        //if user alt-tabs and comes back, count as activity
        const onFocus = () => markActivity();
        window.addEventListener("focus", onFocus);

        //periodically check if they've been idle too long
        const interval = window.setInterval(() => {
            const last = Number(localStorage.getItem(LS_KEY) || "0");
            if (!last) return;

            const idleFor = Date.now() - last;
            if (idleFor > IDLE_MS){
                doLogout();
            }
        }, CHECK_EVERY_MS);

        return () => {
            events.forEach((e) => window.removeEventListener(e, onActivity));
            window.removeEventListener("focus", onFocus);
            window.clearInterval(interval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
}