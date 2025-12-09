import NavGate from "@/app/components/NavGate";
import ForgotPasswordClient from "./ForgotPasswordClient";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
      <NavGate />

      <div className="w-full lg:max-w-[1140px] mx-auto py-10 px-5 lg:px-2">
        <h1 className="mb-4">Forgot Your Password?</h1>
        <p className="text-sm text-gray-600 mb-6">
          Reset your password to regain secure access to your RioPlex Business Exchange account.
        </p>
        <ForgotPasswordClient />
      </div>
    </div>
  );
}
