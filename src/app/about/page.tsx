import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import NavGate from "../components/NavGate";
import Button from "../components/Button";
import AuthForm from "../../components/AuthForm";
import VideoSection from "../components/VideoSection";
import AnimatedBeamDemo from "../components/animated-beam-demo"

const experts = [
  {
    name: "John Wilson",
    title: "John T. Wilson, a seasoned business attorney, is a trusted legal advisor committed to guiding entrepreneurs through smooth, secure, and successful business transactions.",
    img: "/images/experts/john-wilson.png",
  },
  {
    name: "Abby Young",
    title: "Abby Young, CPA and founder of AYCPA, is a dedicated accounting professional focused on helping small business owners achieve financial clarity through expert tax strategy, planning, and guidance.",
    img: "/images/experts/abby-young.png",
  },
  {
    name: "Juan A. Garcia",
    title: "Juan A. Garcia, Of Counsel at Villeda Law Group, is a seasoned legal and financial advisor dedicated to guiding businesses through mergers, acquisitions, and strategic growth with clarity and confidence.",
    img: "/images/experts/juan-garcia.png",
  },
];


export const metadata: Metadata = {
  title: "About RPBX | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors"
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

          <div className="flex-1 lg:order-2 hidden lg:block">
            <Image
              src="/images/header/about-header.png"
              alt="Investors and Business Owners"
              width={2000}
              height={450}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>

      {/* Div 2: How It Works */}
      <div className="bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center bg-fixed lg:bg-fixed flex justify-center py-10">
        <div className="flex flex-col lg:flex-row gap-y-4 lg:gap-y-0 lg:gap-x-10 w-full lg:w-[1140px] px-4 lg:px-0">

          <div className="flex-1 flex flex-col items-center justify-center">
            <AnimatedBeamDemo />
          </div>


          <div className="flex-1 flex flex-col gap-y-6 justify-center">
            <h2 className="text-white">About RPBX</h2>

            <p className="text-white">Welcome to RioPlex Business Exchange, your gateway to connecting businesses and investors across Texas. We champion local entrepreneurship and regional growth. Whether you’re a business owner seeking visibility and expansion or an investor looking for promising opportunities, RPBX provides a dynamic, secure platform to make it happen. Explore our services and learn more about which membership fits your needs best.</p>

            <div className="flex flex-col gap-4">
              <Link href="/business"><Button>Looking for an Investor</Button></Link>
              <Link href="/investor"><Button variant="white">Looking to Invest</Button></Link>
            </div>
          </div>

        </div>
      </div>

      {/* Div 3: Experts Section */}
      <div className="flex flex-col items-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top py-[15px]">

        <div className="w-full px-4 lg:w-[1140px] lg:px-0 mx-auto flex flex-col gap-y-5 lg:gap-y-0 lg:gap-x-10 py-10">
          <h2 className="text-center -mt-4">Meet Our Experts</h2>

          <div className="flex flex-col lg:flex-row justify-center gap-5 mt-8 ">
            {experts.map((expert) => (
              <div
                key={expert.name}
                className="flex-1 rounded-2xl shadow-lg overflow-hidden flex flex-col items-center bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
              >
                {/* Top gray section */}
                <div className="bg-[#272727] w-full h-30"></div>

                {/* Bottom white section */}
                <div className="bg-white w-full flex flex-col items-center p-5">
                  <div className="w-36 h-36 bg-white rounded-full border-4 border-[#272727] flex justify-center items-center -mt-25">
                    <Image
                      src={expert.img}
                      alt={expert.name}
                      width={100}
                      height={100}
                      className="w-35 h-35 rounded-full object-cover p-1"
                    />
                  </div>
                  <h4 className="mt-4 large">{expert.name}</h4>
                  <p className="text-center mt-1">{expert.title}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

      {/* Div 4: video */}
      <VideoSection videoUrl="https://www.youtube.com/embed/VZZhns1tcMU"/>
    </div>
  );
}