import { createClientRSC } from "@/../utils/supabase/server"
import { redirect } from "next/navigation"
import ResetPasswordForm from "./ResetPasswordForm"
import NavGate from "@/app/components/NavGate"

export default async function ResetPasswordPage() {
  const supabase = await createClientRSC()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) redirect('/login')

  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
      <NavGate />

      <div className="w-full lg:max-w-[1140px] mx-auto py-10 px-5 lg:px-2">
        <h1 className="mb-4">Reset Your Password</h1>
        <p className="text-sm text-gray-600 mb-6">
          Create a new password to securely access your RioPlex Business Exchange account.
        </p>

        <ResetPasswordForm />
      </div>
    </div>
  )
}
