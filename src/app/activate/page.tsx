import Link from "next/link";
import NavbarActivate from "./../components/NavBarActivate";
import Button from "./../components/Button";
import { createClientRSC } from "@/../utils/supabase/server"
import { redirect } from "next/navigation"
import PricingTable from "./../components/pricing-table";
import NewsletterSignup from "../../components/ui/newsletter";
import CardCarousel from "../components/Card-carousel";
import BusinessSlider from "@/components/sliders/businessslider";
import Image from "next/image";

export default async function Home() {
  const supabase = await createClientRSC();
  
  // Use getSession instead of getUser for better performance
  const { data: { session }, error } = await supabase.auth.getSession();
  
  // Only log non-authentication errors
  if (error && error.message !== 'Auth session missing!' && error.status !== 400) {
    console.error('Unexpected auth error:', error);
  }
  
  // Redirect if user is authenticated
  if (session?.user) {
    return redirect("/dashboard");
  }

  const dark = false;

    
  return (
    <div>
      {/* Div 1: 2 rows */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center">
        <div className="pt-[103px]">
          <NavbarActivate />
        </div>

        {/* row becomes column on tablet/mobile */}
        <div className="flex flex-col lg:flex-row py-10 lg:py-0">
          <div className="flex-1 flex justify-center lg:justify-end items-center px-4 lg:p-[15px] order-2 lg:order-1">
            <div className="flex flex-col items-center w-full lg:w-[560px] max-w-lg">
              <h1 className="text-center">Connect Your Business With Investors Today</h1>
    <>
  <Link href="/login" className="w-full">
  <button className="mt-5 w-full px-6 py-2 rounded-full font-medium transition bg-[#60BC9B] hover:bg-[var(--color-primary-hover)] text-white border border-gray-300 hover:border-transparent flex items-center justify-center gap-2">
    Start 30 Day Free Trial
  </button>
  </Link>
  <Link href="/login" className="w-full">
      <button className="mt-5 w-full px-6 py-2 rounded-full font-medium transition bg-white hover:bg-[var(--color-primary-hover)] text-black hover:text-white border border-gray-300 hover:border-transparent">
        Learn More
      </button>
  </Link>
      <p className="mt-5 text-center small text-grey">
        By clicking Continue to join or sign in, you agree to RioPlex Business Exchange&apos;s <Link href="/terms" className="hover:underline">Terms of Service</Link>, <Link href="/privacy" className="hover:underline">Privacy Policy</Link>, and <Link href="/cookies" className="hover:underline">Cookie Policy</Link>.
      </p>
      <p className="mt-5 text-center">Looking to Invest? <Link href="/pricing" className="green-link">Join Now</Link></p>
    </>
            </div>
          </div>

          <div className="flex-1 lg:order-2 hidden lg:block bg-[url('/images/header/activate-header.png')] bg-cover bg-left bg-no-repeat min-h-[450px]">
          </div>
        </div>
      </div>


      {/* Div 2: 1 div containing 3 div columns */}
      
      <div className="bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center bg-fixed lg:bg-fixed flex justify-center py-10 px-4 lg:px-0">
      <PricingTable dark={dark} loggedIn={false} />
      </div>


      {/* Div 3: As An Business */}
      <div className="flex flex-col items-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top py-[15px]">

        <div className="w-full px-4 lg:w-[1140px] lg:px-0 mx-auto flex flex-col lg:flex-row gap-y-6 lg:gap-y-0 lg:gap-x-10 py-10">

          <div className="flex-1 flex flex-col items-center rounded-2xl">
              <Image
              src="/images/other/business-mockup.png"
              alt="Business Feed"
              width={2000}
              height={450}
              className="w-full h-auto transition-transform duration-300 lg:hover:-translate-y-2"
              priority
            />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h3>As A Business Owner</h3>
            <p className="py-5">Discover potential investors who align with your business goals through our easy-to-use platform. Browse investor profiles, filter by industry and investment preferences, and connect with the right partners—all in one seamless dashboard.</p>
            <Link href="/subscribe/business_monthly?trial=30" className="max-w-40"><Button className="w-40">Get Started</Button></Link>
          </div>

        </div>

        {/* Row 2 */}
        <div className="flex flex-col lg:flex-row gap-y-6 lg:gap-y-0 lg:gap-x-[15px] w-full pr-4 lg:pb-10">
          <BusinessSlider />

          <div className="flex-1 flex justify-center lg:justify-start">
            <div className="flex flex-col items-center text-center w-full lg:w-[560px] px-4 pb-8 lg:pb-0 overflow-hidden">
              <CardCarousel />
            </div>
          </div>
        </div>

        <div className="w-full px-4 lg:w-[1140px] lg:px-0 mx-auto flex flex-col lg:flex-row gap-y-6 lg:gap-y-0 lg:gap-x-10 py-10">

          <div className="flex-1 flex flex-col items-center rounded-2xl">
              <Image
              src="/images/other/investor-mockup.png"
              alt="Investor Feed"
              width={2000}
              height={450}
              className="w-full h-auto transition-transform duration-300 lg:hover:-translate-y-2"
              priority
            />
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <h3>As An Investor</h3>
            <p className="py-5">Discover vetted businesses aligned with your investment goals through our easy-to-use platform. Filter listings by industry, size, and location, and connect directly with business owners—all in one secure, streamlined dashboard.</p>
            <Link href="/subscribe/investor_plan" className="max-w-40"><Button className="w-40">Get Started</Button></Link>
          </div>
        </div>
        
      </div>

      {/* Div 4: 1 div */}
      <NewsletterSignup />

    </div>
  );
}
