// app/(member)/dashboard/matches/page.tsx

import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";
import { getDashboardMatches } from "@/lib/matching/dashboard/getDashboardMatches";
import DashboardMatchesView from "./_components/DashboardMatchesView";

export const dynamic = "force-dynamic";

export default async function DashboardMatchesPage() {
  const supabase = await createClientRSC();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const dashboardMatches = await getDashboardMatches(supabase, user.id, {
    limit: 50,
    includeWeak: false,
  });

  return <DashboardMatchesView data={dashboardMatches} />;
}