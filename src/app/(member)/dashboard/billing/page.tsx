// app/billing/page.tsx (Server Component)
import NavGate from "@/app/components/NavGate";
import BillingClient from "./BillingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing & Subscription | RioPlex Business Exchange",
  description: "Manage your billing information and subscription plans on RioPlex Business Exchange.",
};

export default function BillingPage() {
  return (
    <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
      <NavGate />
      <BillingClient />
    </div>
  );
}
