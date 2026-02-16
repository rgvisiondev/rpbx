import { NextRequest, NextResponse } from "next/server";

const IDLE_MS = 20 * 60 * 1000;

function isProtectedPath(pathname: string){
    return pathname.startsWith("/dashboard");
}

export function middleware(req: NextRequest){
    const { pathname } = req.nextUrl;

    if (!isProtectedPath(pathname)){
        return NextResponse.next();
    }

    // if no activity cookie, treat as "start now"
    const lastStr = req.cookies.get("rpbx_last_activity")?.value;
    const last = lastStr ? Number(lastStr) : 0;

    if (!last || Number.isNaN(last)){
        // No cookie: redirect to login or allow client set it
        const res = NextResponse.next();
        res.cookies.set("rpbx_last_activity", String(Date.now()), {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/"
        });
        return res;
    }

    const idleFor = Date.now() - last;
    if (idleFor > IDLE_MS){
        const url = req.nextUrl.clone();
        url.pathname = "/logout";
        url.searchParams.set("reason", "inactive");
        url.searchParams.set("next", pathname);
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};