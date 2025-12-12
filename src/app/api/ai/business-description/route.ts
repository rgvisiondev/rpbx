import { NextResponse } from 'next/server';
import { getBusinessDescriptionFromSite } from '@/lib/openai-query';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = String(body?.url ?? '');
    const address = String(body?.address ?? '');
    const business_name = String(body?.business_name ?? '');

    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 });
    }

    const description = await getBusinessDescriptionFromSite(url, address, business_name);
    return NextResponse.json({ description });
  } catch (err) {
    console.error('API /ai/business-description error', err);
    return NextResponse.json({ error: 'Failed to generate description' }, { status: 500 });
  }
}
