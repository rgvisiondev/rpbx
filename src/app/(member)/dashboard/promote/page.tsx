import NavGate from "@/app/components/NavGate";
import PromoteClient from "./PromoteClient";

export default function PromotePage() {
  return (
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <div>
          <NavGate />
        </div>

    <div className="w-full lg:w-[1140px] mx-auto py-10 px-5 lg:px-0">
      <h1 className="mb-4">Promote A Listing</h1>
      <p className="text-sm text-gray-600 mb-6">
        Choose a listing to boost. This creates a Stripe subscription tied to that listing.
      </p>

        <PromoteClient />
      </div>
    </div>
  );
}
