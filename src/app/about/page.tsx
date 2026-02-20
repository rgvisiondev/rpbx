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
import { Experts } from "../components/popups/Experts";
import Modal from "../components/Modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { experts } from "@/lib/advisors/advisors";

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
      <div className="flex flex-col items-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top pt-[15px] overflow-hidden">
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
                            contactHeadline={expert.contactHeadline}
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
        <div className="bg-[#272727] w-full">
          <div className="mx-auto w-full max-w-[1140px] px-4 lg:px-2 py-6">
            <p className="text-white text-center">
              <span className="font-bold">Disclaimer:</span> Information shared
              is for educational purposes only and is not professional advice.
              Advisors are independent and not representatives of RioPlex. Users
              are responsible for their own decisions. 
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="hover:cursor-pointer group inline-flex items-center gap-2 text-[14px] font-semibold text-white transition-colors hover:text-[#9ed3c3] focus:outline-none ml-2"
                  >
                    <span className="relative">
                        Read More
                      <span className="absolute left-0 -bottom-[2px] h-[2px] w-0 bg-[#9ed3c3] transition-all duration-300 group-hover:w-full" />
                    </span>
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      RioPlex Business Exchange – Advisor & Platform Disclaimer
                    </DialogTitle>
                    <DialogDescription>
                      Independent Advisors & Fiduciary Disclosure
                    </DialogDescription>
                  </DialogHeader>
                  <div className="no-scrollbar -mx-4 max-h-[50vh] overflow-y-auto px-4">
                    <p className="mb-4 leading-normal">
                      RioPlex Business Exchange (“RioPlex”) is a technology and
                      education platform designed to connect business owners,
                      buyers, and trusted professional advisors. All
                      professionals featured on or affiliated with RioPlex
                      participate as independent, third-party advisors and are
                      not employees, agents, or representatives of RioPlex. Each
                      advisor acts independently and, where applicable, in a
                      fiduciary capacity, owing duties solely to their
                      individual clients. Advisors are required to act in their
                      clients’ best interests and do not provide advice on
                      behalf of RioPlex. RioPlex does not provide legal,
                      financial, tax, or investment advice and does not endorse
                      or guarantee the services, outcomes, or recommendations of
                      any advisor or user on the platform. Engagement with any
                      advisor is at the sole discretion of the user and governed
                      by a separate agreement between the advisor and the
                      client. Participation in RioPlex does not create a
                      partnership, joint venture, agency, or employment
                      relationship between RioPlex and any advisor or user.
                      Users are encouraged to conduct their own due diligence
                      and consult appropriate licensed professionals before
                      making business, legal, financial, or investment
                      decisions.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </p>
          </div>
        </div>
      </div>
      {/* Div 4: video */}
      <VideoSection videoUrl="https://www.youtube.com/embed/_pYD-7zHIoA" />
    </div>
  );
}
