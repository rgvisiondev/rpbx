// app/dashboard/layout.tsx
export const revalidate = 0;

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClientRSC } from "@/../utils/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="bg-white"> {/* no container, no padding here */}
      {children}
    </div>
  );
}
