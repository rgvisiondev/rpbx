// app/billing/page.tsx (Server Component)
import NavGate from "@/app/components/NavGate";
import BillingClient from "./BillingClient";

export default function BillingPage() {
  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
      <NavGate />
      <BillingClient />
    </div>
  );
}
