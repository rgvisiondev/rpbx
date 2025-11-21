// app/components/NavGate.tsx
import Navbar from "./Navbar";
import Navbar2 from "./Navbar-2";
import { createClientRSC } from "@/../utils/supabase/server";

type UserType = "business" | "investor" | "admin" | null;

export default async function NavGate() {
  const supabase = await createClientRSC();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <Navbar />;

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", user.id)
    .maybeSingle<{ user_type: string | null }>();

  const userType = (profile?.user_type as UserType) ?? null;

  return <Navbar2 userType={userType} />;
}
