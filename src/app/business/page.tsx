import Image from "next/image";
import Link from "next/link"
import NavGate from "../components/NavGate";
import Button from "../components/Button";
import AuthForm from "../../components/AuthForm";
import CardCarousel from "../components/Card-carousel";
import VideoSection from "../components/VideoSection";
import type { Metadata } from "next";
import BusinessSlider from "@/components/sliders/businessslider";
import CarouselBusiness from "@/components/ui/carouselbusiness";

export const metadata: Metadata = {
  title: "About Business Accounts | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors"
};



export default async function Business() {

  return (
    <div>
      {/* Div 1: 2 rows */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center">
        <div>
          <NavGate />
        </div>

        {/* Buy A Business */}
        <div className="flex flex-col lg:flex-row py-10 lg:py-0">
          <div className="flex-1 flex justify-center lg:justify-end items-center px-4 lg:p-[15px] order-2 lg:order-1">
            <div className="flex flex-col items-center w-full lg:w-[560px] max-w-lg">
              <h1 className="text-center">Secure Your Legacy.<br /> Attract Investors.</h1>

              <AuthForm />
            </div>
          </div>

          <div className="flex-1 lg:order-2 hidden lg:block bg-[url('/images/header/business-header.png')] bg-cover bg-left bg-no-repeat min-h-[450px]">
          </div>

        </div>
      </div>

      {/* Div 2: How It Works */}
      <div className="bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center bg-fixed lg:bg-fixed flex justify-center py-10">
        <div className="flex flex-col lg:flex-row gap-y-4 lg:gap-y-0 lg:gap-x-10 w-full lg:max-w-[1140px] px-4 lg:px-2">

          <div className="flex-1 flex flex-col">
            <h2 className="text-white">How It Works</h2>

            <div className="flex flex-col gap-6 mt-10">
              <div className="flex flex-row transition-transform duration-300 lg:hover:translate-x-2">
                <div className="flex items-center justify-center min-w-12 max-h-12 bg-[#61BD9C] rounded-full mr-4">
                  <h4 className="text-white">1</h4>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-white">Select Your Package</h4>
                  <p className="text-white pt-2">Choose to advertise your business and subscribe monthly, or save 20% when you subscribe annually.</p>
                </div>
              </div>

              <div className="flex flex-row transition-transform duration-300 lg:hover:translate-x-2">
                <div className="flex items-center justify-center min-w-12 max-h-12 bg-[#61BD9C] rounded-full mr-4">
                  <h4 className="text-white">2</h4>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-white">Create Your Listing</h4>
                  <p className="text-white pt-2">Add as much information as you like, including photos and other documents, in our easy to use listing builder.</p>
                </div>
              </div>

              <div className="flex flex-row transition-transform duration-300 lg:hover:translate-x-2">
                <div className="flex items-center justify-center min-w-12 max-h-12 bg-[#61BD9C] rounded-full mr-4">
                  <h4 className="text-white">3</h4>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-white">Review Your Interested Buyers</h4>
                  <p className="text-white pt-2">Buyers will contact you directly through the information you input on your listing.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="flex flex-col items-center text-center w-full lg:w-[560px]">
            <CarouselBusiness />

          </div>

        </div>
      </div>

      {/* Div 3: As An Business */}
      <div className="flex flex-col items-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top py-[15px]">

        <div className="w-full px-4 lg:max-w-[1140px] md:px-2 mx-auto flex flex-col md:flex-row gap-y-6 md:gap-y-0 md:gap-x-10 py-10">

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
        <div className="flex flex-col md:flex-row gap-y-6 md:gap-y-0 md:gap-x-[15px] w-full pr-4 md:pb-10">
          <BusinessSlider />

          <div className="flex-1 flex justify-center md:justify-start">
            <div className="flex flex-col items-center text-center w-full md:max-w-[560px] px-4 pb-8 md:pb-0 overflow-hidden">
              <CardCarousel />
            </div>
          </div>
        </div>

      </div>

      {/* Div 4: video */}
      <VideoSection videoUrl="https://youtube.com/embed/GLsAlbAw7og" />
    </div>
  );
}
