import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import NavGate from "../components/NavGate";
import Button from "../components/Button";
import AuthForm from "../../components/AuthForm";
import VideoSection from "../components/VideoSection";
import AnimatedBeamDemo from "../components/animated-beam-demo";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Mail } from "lucide-react";
import { Experts } from "../components/popups/Experts";
import Modal from "../components/Modal";

const experts = [
  {
    index: 1,
    name: "John Wilson",
    title: "Business & Banking Attorney",
    shortDescription:
      "Experienced business and banking attorney advising companies on mergers, acquisitions, and complex financial transactions with expertise in corporate structuring.",
    description:
      "John Wilson is a business and banking attorney with extensive experience guiding companies through mergers and acquisitions, securities offerings, and complex regulatory matters. Having advised public and private financial institutions on transactions ranging from multi-branch acquisitions to major debt and equity issuances, he brings a deep understanding of corporate structure and compliance. As founder of Wilson Business & Banking Law, he regularly counsels clients on entity formation, governance, contract negotiation, and strategic business planning. His practical, detail-driven approach makes him a trusted resource for RPBX members navigating growth, acquisition, or structural transitions.",
    img: "/images/experts/john-wilson.png",
    email: "john@jtwilsonlaw.com",
  },
  {
    index: 2,
    name: "Abby Young",
    title: "Certified Public Accountant & Managing Partner",
    shortDescription:
      "CPA providing tax strategy, virtual CFO services, and financial planning for growing businesses and nonprofits, with a focus on proactive, strategic financial leadership.",
    description:
      "Abby Young is a Certified Public Accountant with over a decade of experience supporting businesses, families, and nonprofits with tax strategy, financial planning, and virtual CFO guidance. As Managing Partner of Abigail Young CPA PLLC, she specializes in comprehensive accounting, forecasting, and tax preparation tailored to small and medium-sized businesses across the Rio Grande Valley. Her background in corporate accounting and financial operations allows her to provide proactive, cost-efficient financial leadership to growing organizations. Abby’s commitment to service, accuracy, and community involvement makes her a trusted resource for RPBX members seeking clarity and confidence in their financial decisions.",
    img: "/images/experts/abby-young.png",
    email: "aymurray.cpa@gmail.com",
  },
  {
    index: 3,
    name: "Juan A. Garcia",
    title: "Corporate & M&A Advisor",
    shortDescription:
      "Senior advisor specializing in mergers and acquisitions, private equity, and complex corporate transactions, with extensive experience guiding institutional clients.",
    description:
      "Juan A. Garcia brings over 20 years of experience advising institutional clients on complex mergers and acquisitions, private equity, and strategic corporate transactions. With a background that includes roles at Skadden, Arps and Citigroup, as well as financial executive and external counsel positions, he combines top-tier legal training with practical financial expertise. His work spans corporate structuring, investment management, and asset protection strategies for high-net-worth individuals and investment firms. Juan’s leadership and longstanding commitment to community service make him a trusted resource for RPBX members navigating sophisticated business and financial decisions.",
    img: "/images/experts/juan-garcia.png",
    email: "jgarcia@mybusinesslawyer.com",
  },
  {
    index: 4,
    name: "Bill Martin",
    title: "Private Wealth Advisor",
    shortDescription:
      "Private Wealth Advisor with nearly 30 years of experience helping business owners plan exits, preserve wealth, and align financial strategies with long-term family goals.",
    description:
      "Bill Martin, CFP®, CPWA®, CEPA®, is a Private Wealth Advisor who was born in Brownsville, Texas, and split time between San Antonio and the Rio Grande Valley in his youth. After graduating with a Bachelor of Business Administration from Texas A&M University in College Station in 1997, he began his career in the financial field that same year. He has since completed the CERTIFIED PRIVATE WEALTH ADVISOR® program through Yale University, the CERTIFIED FINANCIAL PLANNER™ program with the College for Financial Planning, and the Certified Exit Planning Advisor® program with the Exit Planning Institute. Bill has worked as a financial advisor with three prominent investment firms—AG Edwards (1997–2008), Morgan Stanley (2008–2016), and Raymond James (2016 to present)—all based in McAllen. Raised by two financial advisors, John and Audrey Martin, his career path came naturally. He currently serves on the Board of Trustees for the Museum of South Texas History and previously served 14 years on the IDEA Public Schools Board, during which the organization grew from approximately 1,000 students in South Texas to nearly 60,000 students across Texas, Louisiana, and Florida, with an annual budget exceeding one billion dollars. Bill also served as president of the McAllen North Rotary Club and is involved with the Valley Land Fund and the Valley Symphony Orchestra as both a supporter and manager of endowments. He and his wife, Margie, have six adult children—three boys and three girls—and together they worship and serve their community through Foundations Methodist Church in McAllen.",
    img: "/images/experts/bill-martin.png",
    email: "b.martin@raymondjames.com",
  },
];

export const metadata: Metadata = {
  title: "About RPBX | RioPlex Business Exchange",
  description:
    "RPBX is a leading business marketplace connecting business owners directly with investors. Learn about our business exchange platform, business valuation services, and how we help you sell your business in Texas without traditional broker fees.",
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
              <h1 className="text-center">
                Empowering Business Transitions & Growth
              </h1>

              <AuthForm />
            </div>
          </div>

          <div className="flex-1 lg:order-2 hidden lg:block bg-[url('/images/header/about-header.png')] bg-cover bg-left bg-no-repeat min-h-[450px]"></div>
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

            <p className="text-white">
              Welcome to RioPlex Business Exchange, your trusted business
              marketplace connecting business owners directly with investors
              across Texas. As a leading business broker alternative, we serve
              Houston, Austin, and throughout the state. Whether you’re ready to
              sell your business, need a confidential information memorandum
              (CIM), or want to find businesses for sale near you, RPBX provides
              the tools and connections you need. We specialize in business
              valuations and facilitating transactions including seller
              financing options—all without traditional brokerage fees.
            </p>

            <div className="flex flex-row gap-4">
              <Link href="/business">
                <Button>Looking for an Investor</Button>
              </Link>
              <Link href="/investor">
                <Button variant="white">Looking to Invest</Button>
              </Link>
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
            className="w-full mt-8 " // ⬅ full width of the 1140px container
          >
            <CarouselContent className="-ml-4">
              {" "}
              {/* optional: for spacing between slides */}
              {experts.map((expert) => (
                <CarouselItem
                  key={expert.index}
                  className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 "
                  // full-width on mobile, 2-up on small, 3-up on large
                >
                  <div className="rounded-2xl border-1 overflow-hidden flex flex-col items-center bg-white transition-all duration-300 h-full">
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
                      <div className="w-[144px] h-[144px] bg-white rounded-full border-4 border-[#272727] flex justify-center items-center -mt-[96px] relative z-10">
                        <Image
                          src={expert.img}
                          alt={expert.name}
                          width={100}
                          height={100}
                          className="w-[136px] h-[136px] rounded-full object-cover p-1"
                        />
                      </div>

                      <h4 className="mt-4 mb-2 large">{expert.name}</h4>
                      <p className="mt-1 text-[15px] text-[#4b4b4b] text-center">
                        {expert.shortDescription}
                      </p>

                      <div className="w-full mt-4 flex justify-end">
                        <Modal
                          trigger={
                            <button
                              type="button"
                              className="hover:cursor-pointer group inline-flex items-center gap-2 text-[14px] font-semibold text-[#272727] transition-colors hover:text-[#9ed3c3] focus:outline-none"
                            >
                              <span className="relative">
                                Read More
                                <span className="absolute left-0 -bottom-[2px] h-[2px] w-0 bg-[#9ed3c3] transition-all duration-300 group-hover:w-full" />
                              </span>
                              <span className="transition-transform duration-300 group-hover:translate-x-1">
                                →
                              </span>
                            </button>
                          }
                        >
                          <Experts
                            image={expert.img}
                            name={expert.name}
                            description={expert.description}
                            title={expert.title}
                            email={expert.email}
                          />
                        </Modal>
                      </div>
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
