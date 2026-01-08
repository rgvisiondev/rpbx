import { NextResponse } from 'next/server';
import { getBusinessDescriptionFromSite } from '@/lib/openai-query';
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";
import { createClientWritable } from '@/../utils/supabase/server';

const redis = Redis.fromEnv();

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "5 m"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});


export async function POST(req: Request) {
  try {

    const supabase = await createClientWritable();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const url = String(body?.url ?? '');
    const address = String(body?.address ?? '');
    const business_name = String(body?.business_name ?? '');
    const identifier = user?.id || req.headers.get("x-forwarded-for")?.split(",")[0] || "anonymous";
    const { success, reset, limit, remaining } = await ratelimit.limit(identifier);

    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    if (!success){
      return NextResponse.json({ error: "Rate limit reached, try again later", reset, remaining, limit}, { status: 429})
    }

    const description = await getBusinessDescriptionFromSite(url, address, business_name);
    return NextResponse.json({ description });
  } catch (err) {
    console.error('API /ai/business-description error', err);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
