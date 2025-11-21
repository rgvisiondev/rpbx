// dashboard/components/InvestorActions.tsx
import Link from "next/link"
export default function InvestorActions() {
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <Link 
        href="/listings" 
        className="flex-1 flex flex-col items-center p-5 bg-[#60A1BC] rounded-2xl hover:opacity-90 transition"
      >
        <p className="text-white">Browse Listings</p>
      </Link>
      <Link 
        href="/listings/saved" 
        className="flex-1 flex flex-col items-center p-5 bg-[#60BC9B] rounded-2xl hover:opacity-90 transition"
      >
        <p className="text-white">Saved Listings</p>
      </Link>
      <Link 
        href="/profile/edit" 
        className="flex-1 flex flex-col items-center p-5 bg-[#E79F3C] rounded-2xl hover:opacity-90 transition"
      >
        <p className="text-white">Edit Profile</p>
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