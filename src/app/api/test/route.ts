import { NextResponse } from 'next/server'
import { createClientRSC } from '../../../../utils/supabase/server'

export async function GET() {
  const supabase = await createClientRSC();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id")
    .limit(10);

  return NextResponse.json({ data, error });
}
