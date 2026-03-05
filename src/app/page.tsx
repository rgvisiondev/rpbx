import Link from "next/link";
import Navbar from "./components/Navbar";
import Button from "./components/Button";
import Modal from "./components/Modal";
import AuthForm from "@/components/AuthForm";
import { createClientRSC } from "@/../utils/supabase/server"
import { redirect } from "next/navigation"
import PricingTable from "./components/pricing-table";
import NewsletterSignup from "../components/ui/newsletter";
import MyCarousel from "../components/ui/myCarousel";
import HoverGif from '../components/HoverGif';
import HomeSlider from "@/components/sliders/homeslider";
import Eval from "./components/popups/Eval";
import Legal from "./components/popups/Legal";
import Cpa from "./components/popups/Cpa";
import ValuateCta from "./components/valuate-cta";
import CardCarousel from "./components/Card-carousel";
import Marketing from "./components/popups/marketing";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClientRSC();

  // Use getSession instead of getUser for better performance
  const { data: { user }, error } = await supabase.auth.getUser();

  // Only log non-authentication errors
  if (error && error.message !== 'Auth session missing!' && error.status !== 400) {
    console.error('Unexpected auth error:', error);
  }

  // Redirect if user is authenticated
  if (user) {
    return redirect("/dashboard");
  }

  const dark = false;


  return (
    <div>
      {/* Div 1: 2 rows */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center">
        <div>
          <Navbar />
        </div>

        {/* row becomes column on tablet/mobile */}
        <div className="flex flex-col lg:flex-row py-10 lg:py-0">
          <div className="flex-1 flex justify-center lg:justify-end items-center px-4 lg:p-[15px] order-2 lg:order-1">
            <div className="flex flex-col items-center w-full lg:w-[560px] max-w-lg">
              <h1 className="text-center">Where Small Businesses Are Protected, Valued, and Grown</h1>
              <AuthForm />
            </div>
          </div>

          <div className="flex-1 lg:order-2 hidden lg:block bg-[url('/images/header/home-header.png')] bg-cover bg-left bg-no-repeat min-h-[450px]">
          </div>
        </div>
      </div>


      {/* Div 2: 1 div containing 3 div columns */}

      <div className="bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center bg-fixed lg:bg-fixed flex justify-center py-10 px-4 lg:px-0">
        <PricingTable dark={dark} loggedIn={false} />
      </div>


      {/* Div 3: 3 rows */}
      <div className="flex flex-col items-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top py-[15px] overflow-hidden">


        {/* Row 1 */}
        <div className="w-full px-4 lg:max-w-[1140px] lg:px-2 mx-auto flex flex-col lg:flex-row gap-y-6 lg:gap-y-0 lg:gap-x-[45px] py-10">
          <div className="flex justify-center lg:justify-end lg:w-2/5">
            <div className="flex flex-col  w-full">
              <h2 className="text-center lg:text-start">Explore our Blog topics</h2>
              <p className="text-center lg:text-left pt-1">RPBX is here to offer you valuable knowledge. We will help guide you in making your next steps.</p>
            </div>
          </div>
          <div className="flex justify-center lg:justify-start lg:w-3/5">
            <div className="flex flex-col items-center w-full">
              {/* Blog Topic */}
              <div className="flex flex-wrap gap-3 lg:gap-4 justify-center lg:justify-start">
                <Link href="/blog?category=entrepreneurship-and-growth-category">
                  <Button variant="white">Entrepreneurship & Growth</Button>
                </Link>
                <Link href="/blog?category=investor-relations-category">
                  <Button variant="white">Investor Relations</Button>
                </Link>
                <Link href="/blog?category=exit-planning-category">
                  <Button variant="white">Exit Planning</Button>
                </Link>
                <Link href="/blog?category=mergers-and-acquisitions-category">
                  <Button variant="white">M&amp;A</Button>
                </Link>
                <Link href="/blog?category=local-market-insights-category">
                  <Button variant="white">Local Market Insights</Button>
                </Link>
                <Link href="/blog?category=finance-and-valuation-category">
                  <Button variant="white">Finance & Valuation</Button>
                </Link>
                <Link href="/blog?category=business-selling-category">
                  <Button variant="white">Selling</Button>
                </Link>
                <Link href="/blog?category=business-buying-category">
                  <Button variant="white">Buying</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>



        {/* Row 2 */}
        <div className="flex flex-col md:flex-row gap-y-6 md:gap-y-0 w-full pr-4">
          <HomeSlider />

          <div className="flex-1 flex justify-center md:justify-start overflow-hidden">
            <div className="flex flex-col items-center text-center w-full md:max-w-[500px] px-4">
              <MyCarousel />
            </div>
          </div>
        </div>

        <div className="max-w-[1140px] mx-auto flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 lg:w-2/3">
            <ValuateCta />
          </div>
          <div className="w-full md:w-1/2 lg:w-1/3 overflow-hidden xl:overflow-visible">
            <CardCarousel />
            <p className="small text-grey text-center pt-2">Swipe left to explore</p>
          </div>
        </div>


        {/* Row 3 */}
        <div className="w-full lg:max-w-[1140px] px-4 lg:px-0 flex flex-col items-center py-10">
          <h2>Business Solutions</h2>
          <p className="text-center pt-1">Connect with Our Trusted Advisors for Tailored Business Solutions</p>

          {/* four cols on desktop, two on tablet/mobile */}
          <div className="mt-4 lg:px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-0 w-full">

            {/* 1 */}
            <div className="flex flex-col items-center">
              <Modal
                trigger={
                  <HoverGif
                    staticSrc="/images/icons/evaluation.png"
                    gifSrc="/images/gifs/evaluation.gif"
                    alt="solution-icon-1"
                    width={250}
                    height={250}
                  />
                }
              >
                <Eval />



              </Modal>
              <h4 className="text-center mt-2">Business Valuation</h4>
            </div>


            {/* 2 */}
            <div className="flex flex-col items-center">
              <Modal
                trigger={
                  <HoverGif
                    staticSrc="/images/icons/legal.png"
                    gifSrc="/images/gifs/legal.gif"
                    alt="solution-icon-3"
                    width={250}
                    height={250}
                  />
                }
              >
                <Legal />

              </Modal>
              <h4 className="text-center mt-2">Legal Representation</h4>
            </div>

            {/* 3 */}
            <div className="flex flex-col items-center">
              <Modal
                trigger={
                  <HoverGif
                    staticSrc="/images/icons/cpa.png"
                    gifSrc="/images/gifs/cpa.gif"
                    alt="solution-icon-4"
                    width={250}
                    height={250}
                  />
                }
              >
                <Cpa />

              </Modal>
              <h4 className="text-center mt-2">CPA &amp; Book Keeping Assistant</h4>
            </div>

            {/* 4 */}
            <div className="flex flex-col items-center">
              <Modal
                trigger={
                  <HoverGif
                    staticSrc="/images/icons/marketing.png"
                    gifSrc="/images/gifs/marketing.gif"
                    alt="solution-icon-4"
                    width={250}
                    height={250}
                  />
                }
              >
                <Marketing />

              </Modal>
              <h4 className="text-center mt-2">Media Amplification</h4>
            </div>

          </div>
        </div>
      </div>
      {/* Div 5: Newsletter */}
      <NewsletterSignup />
    </div>
  );
}
