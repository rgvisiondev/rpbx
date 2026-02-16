import { NextRequest, NextResponse } from "next/server";
import { createClientWritable } from "../../../utils/supabase/server";

export async function GET(req: NextRequest){
    const supabase = await createClientWritable();
    await supabase.auth.signOut();

    const next = req.nextUrl.searchParams.get("next") || "/login";
    const url = new URL(next, req.url);

    // clear activity cookie
    const res = NextResponse.redirect(url);
    res.cookies.set("rpbx_last_activity", "", { path: "/", maxAge: 0});

    return res;
}