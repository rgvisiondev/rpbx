"use client";

import { motion } from "framer-motion";
import Eval from "@/app/components/popups/Eval";
import Button from "@/app/components/Button";
import { useState, useEffect } from "react";
import Modal from "@/app/components/Modal";
import EvaluationCheckoutButton from "@/app/components/EvaluationCheckoutButton";

export default function BusinessSlider() {
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
      className="bg-white shadow-lg border-y-2 border-r-2 border-grey-500 flex-1 flex justify-center lg:justify-end rounded-tr-2xl rounded-br-2xl "
    >
      <div className="flex flex-col items-start w-full lg:w-[560px] py-8 lg:py-10 px-6 lg:px-2">
        <h2>Get Your Business Valuation</h2>
        <p className="lg:pr-15  pt-1">
          Know the true value of your business with a professional small business valuation powered by Biz Equity. Essential for sellers preparing to list their business, our valuations help you understand how to value a small company. RPBX members save 50% on valuations.
        </p>
        <EvaluationCheckoutButton color="white" />

        {/* Learn More button */}
        <Modal
          trigger={
            <Button className="mt-3 lg:mt-3 w-full sm:w-auto" variant="white">Learn More</Button>
          }
        >
          <Eval />


        </Modal>

      </div>
    </motion.div>
  );
}
