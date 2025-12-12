import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import NavGate from "../components/NavGate";
import Button from "../components/Button";
import AuthForm from "../../components/AuthForm";
import VideoSection from "../components/VideoSection";
import AnimatedBeamDemo from "../components/animated-beam-demo"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ReadMore } from "@/components/ReadMore";
import { Mail } from "lucide-react";

const experts = [
  {
    index: 1,
    name: "John Wilson",
    title: "John Wilson is a business and banking attorney with extensive experience guiding companies through mergers and acquisitions, securities offerings, and complex regulatory matters. Having advised public and private financial institutions on transactions ranging from multi-branch acquisitions to major debt and equity issuances, he brings a deep understanding of corporate structure and compliance. As founder of Wilson Business & Banking Law, he regularly counsels clients on entity formation, governance, contract negotiation, and strategic business planning. His practical, detail-driven approach makes him a trusted resource for RPBX members navigating growth, acquisition, or structural transitions.",
    img: "/images/experts/john-wilson.png",
    email: "john@jtwilsonlaw.com",
  },
  {
    index: 2,
    name: "Abby Young",
    title: "Abby Young is a Certified Public Accountant with over a decade of experience supporting businesses, families, and nonprofits with tax strategy, financial planning, and virtual CFO guidance. As Managing Partner of Abigail Young CPA PLLC, she specializes in comprehensive accounting, forecasting, and tax preparation tailored to small and medium-sized businesses across the Rio Grande Valley. Her background in corporate accounting and financial operations allows her to provide proactive, cost-efficient financial leadership to growing organizations. Abby’s commitment to service, accuracy, and community involvement makes her a trusted resource for RPBX members seeking clarity and confidence in their financial decisions.",
    img: "/images/experts/abby-young.png",
    email: "aymurray.cpa@gmail.com",
  },
  {
    index: 3,
    name: "Juan A. Garcia",
    title: "Juan A. Garcia brings over 20 years of experience advising institutional clients on complex mergers and acquisitions, private equity, and strategic corporate transactions. With a background that includes roles at Skadden, Arps and Citigroup, as well as financial executive and external counsel positions, he combines top-tier legal training with practical financial expertise. His work spans corporate structuring, investment management, and asset protection strategies for high-net-worth individuals and investment firms. Juan’s leadership and longstanding commitment to community service make him a trusted resource for RPBX members navigating sophisticated business and financial decisions.",
    img: "/images/experts/juan-garcia.png",
    email: "avilleda@mybusinesslawyer.com",
  },
  {
    index: 4,
    name: "Bill Martin",
    title: "Bill Martin is a Certified Exit Planning Advisor® and CERTIFIED FINANCIAL PLANNER™ professional with nearly 30 years of experience guiding business owners through succession planning and long-term financial strategy. As Vice President of Investments at 1845 Capital of Raymond James, he integrates exit planning, wealth management, and family goals to support smooth and informed transitions. With advanced credentials including the CPWA® designation, Bill brings a strategic, client-first approach that makes him a trusted resource for RPBX members preparing for the next stage of their business.",
    img: "/images/experts/bill-martin.png",
    email: "b.martin@raymondjames.com",

  },

];


export const metadata: Metadata = {
  title: "About RPBX | Top Business Brokers & Business Brokerage Firm",
  description: "RPBX is a leading business brokerage firm connecting business owners with investors. Learn about our business broker services, small business valuations, and how we help you sell your business in Texas."
};


export default function AboutPage() {


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
              <h1 className="text-center">Empowering Business Transitions & Growth</h1>

              <AuthForm />
            </div>
          </div>

          <div className="flex-1 lg:order-2 hidden lg:block bg-[url('/images/header/about-header.png')] bg-cover bg-left bg-no-repeat min-h-[450px]">
          </div>

        </div>
      </div>

      {/* Div 2: How It Works */}
      <div className="bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center bg-fixed lg:bg-fixed flex justify-center py-10">
        <div className="flex flex-col md:flex-row gap-y-4 lg:gap-y-0 lg:gap-x-10 w-full lg:w-[1140px] px-4 lg:px-0">

          <div className="flex-1 flex flex-col items-center justify-center">
            <AnimatedBeamDemo />
          </div>


          <div className="flex-1 flex flex-col gap-y-6 justify-center">
            <h2 className="text-white">About RPBX</h2>

            <p className="text-white">Welcome to RioPlex Business Exchange, your trusted business brokerage platform connecting business owners with investors across Texas. As one of the best business broker websites, we serve Houston business brokers, Austin business brokers, and small business brokers throughout the state. Whether you’re ready to sell your business fast, need a confidential information memorandum (CIM), or want to find businesses for sale near you, RPBX provides the tools and connections you need. We specialize in small business brokerage, business valuations, and facilitating transactions including seller financing options.</p>

            <div className="flex flex-row gap-4">
              <Link href="/business"><Button>Looking for an Investor</Button></Link>
              <Link href="/investor"><Button variant="white">Looking to Invest</Button></Link>
            </div>
          </div>

        </div>
      </div>

      {/* Div 3: Experts Section */}
      <div className="flex flex-col items-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top py-[15px] overflow-hidden">
        <div className="w-full px-4 lg:max-w-[1140px] lg:px-2 mx-auto py-10">
          <h2 className="text-center -mt-4">Meet Our Experts</h2>

          <Carousel
            opts={{ align: "start", loop: true }}
            className="w-full mt-8"              // ⬅ full width of the 1140px container
          >
            <CarouselContent className="-ml-4">   {/* optional: for spacing between slides */}
              {experts.map((expert) => (
                <CarouselItem
                  key={expert.index}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                // full-width on mobile, 2-up on small, 3-up on large
                >
                  <div
                    className="rounded-2xl shadow-lg overflow-hidden flex flex-col items-center bg-white transition-all duration-300 h-full"
                  >
                    {/* Top gray section */}
                    <div className="relative bg-[#272727] w-full h-[120px]">
                      <a
                        href={`mailto:${expert.email}`}
                        className="absolute top-3 right-3 text-white hover:text-[#9ed3c3] transition-colors"
                      >
                        <Mail size={22} />
                      </a>
                    </div>

                    {/* Bottom white section */}
                    <div className="bg-white w-full flex flex-col items-center p-5">
                      <div
                        className="w-[144px] h-[144px] bg-white rounded-full border-4 border-[#272727] flex justify-center items-center -mt-[96px] relative z-10"
                      >
                        <Image
                          src={expert.img}
                          alt={expert.name}
                          width={100}
                          height={100}
                          className="w-[136px] h-[136px] rounded-full object-cover p-1"
                        />
                      </div>

                      <h4 className="mt-4 mb-2 large">{expert.name}</h4>
                      <ReadMore
                        id={`read-more-expert-${expert.name}`}
                        text={expert.title}
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
      {/* Div 4: video */}
      <VideoSection videoUrl="https://youtube.com/embed/BUpPR2Bi9uQ" />
    </div>
  );
}