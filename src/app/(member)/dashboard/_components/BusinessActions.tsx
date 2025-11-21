// dashboard/components/BusinessActions.tsx
import Link from 'next/link';
export default function BusinessActions() {
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <Link 
        href="/listings/manage" 
        className="flex-1 flex flex-col items-center p-5 bg-[#60A1BC] rounded-2xl hover:opacity-90 transition"
      >
        <p className="text-white">Update Listing Info</p>
      </Link>
      <Link 
        href="/valuation/checkout" 
        className="flex-1 flex flex-col items-center p-5 bg-[#60BC9B] rounded-2xl hover:opacity-90 transition"
      >
        <p className="text-white">Request Valuation</p>
      </Link>
      <Link 
        href="/listings/promote" 
        className="flex-1 flex flex-col items-center p-5 bg-[#E79F3C] rounded-2xl hover:opacity-90 transition"
      >
        <p className="text-white">Promote Listing</p>
      </Link>
      <Link 
        href="/profile/subscription" 
        className="flex-1 flex flex-col items-center p-5 bg-[#9B60BC] rounded-2xl hover:opacity-90 transition"
      >
        <p className="text-white">Manage Subscription</p>
      </Link>
    </div>
  );
}