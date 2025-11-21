"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Button from "@/app/components/Button";
import { useState, useEffect } from "react";

export default function HomeSlider() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Only runs on client
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize(); // run once on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Render the same on server & client initially
  const initialX = isDesktop ? -500 : -100;

  return (
    <motion.div
      initial={{ opacity: 0, x: initialX }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.2 }}
      className="bg-white shadow-lg border-y-2 border-r-2 border-grey-500 flex-1 flex justify-center lg:justify-end rounded-tr-2xl rounded-br-2xl"
    >
      <div className="flex flex-col items-start w-full lg:w-[560px] py-8 lg:py-10 px-6 lg:px-2">
        <h2>Who is RPBX for?</h2>
        <p className="lg:pr-15 pt-1">
          Connecting small business owners with the right investors to help them
          grow, succeed, and achieve their goals. Join RioPlex Business Exchange
          and be part of a platform built for ambitious businesses and
          forward-thinking investors.
        </p>
        <Link href="/business">
          <Button className="mt-3 lg:mt-3 w-full sm:w-auto" variant="white">
            Looking for an Investor
          </Button>
        </Link>
        <Link href="/investor">
          <Button className="mt-3 lg:mt-3 w-full sm:w-auto" variant="white">
            Looking to Invest
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
