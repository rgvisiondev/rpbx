"use server";

import { createClientRSC } from "../../../../../../../utils/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function setInvestorHidden(_unusedId: string, hidden: boolean){
    const supabase = await createClientRSC();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login?next=/dashboard/profile/edit");

    // Investors are keyed by user_id, so we ignore the passed id and use user.id
    const { error } = await supabase
        .from("investor_profiles")
        .update({ is_hidden: hidden })
        .eq("user_id", user.id);

    if (error) throw error;

    // refresh pages that depend on v_investor_profiles_public
    revalidatePath("/dashboard");
    revalidatePath("/investor-listing");
    revalidatePath("/dashboard/profile/edit");
}