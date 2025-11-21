import { createClientRSC } from "@/../utils/supabase/server"
import { redirect } from "next/navigation"
import ResetPasswordForm from "./ResetPasswordForm"

export default async function ResetPasswordPage() {
    const supabase = await createClientRSC()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) redirect('/login')
    
    return <ResetPasswordForm />
    
}
