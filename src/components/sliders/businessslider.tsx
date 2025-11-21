"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Button from "@/app/components/Button";
import { useState, useEffect } from "react";
import Modal from "@/app/components/Modal";

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
                 Know the true value of your business with a valuation powered by Biz Equity. RPBX members get 50% off their valuations, making it easier than ever to make informed decisions whether you’re planning to sell, grow, or invest.
              </p>
              <Link href="https://rioplexbizx.bizequity.com" target="_blank" ><Button className="mt-3 lg:mt-3 w-full sm:w-auto" variant="white">Get My Valuation</Button></Link>

              {/* Learn More button */}
              <Modal
                trigger={
                  <Button className="mt-3 lg:mt-3 w-full sm:w-auto" variant="white">Learn More</Button>
                }
              >
              <div className="space-y-2">
                <h2>Business Valuation</h2><br />
                  <h4>What is Business Valuation?</h4>
                  <p>
                    Business valuation is the process of determining what a company is worth. It’s a crucial step for any
                    business owner who’s looking to sell, merge, or even plan for future growth. Members save 50% on their valuation when they subscribe to RioPlex Business Exchange.
                  </p><br />

                  <h4>Key Components We Look At:</h4>
                  <ul className="list-disc list-outside pl-6">
                    <li><strong>Financials:</strong> We analyze the business’s revenue, profits, debts, and cash flow.</li>
                    <li><strong>Industry &amp; Market Trends:</strong> We look at how the market and competitors are performing. This helps gauge how well your business stands in the current landscape.</li>
                    <li><strong>Assets &amp; Liabilities:</strong> This includes tangible assets (like equipment) and intangible ones (like patents or brand reputation), as well as debts and other obligations.</li>
                    <li><strong>Operations &amp; Customers:</strong> How well does the business run? Is the customer base stable? Recurring revenue streams and efficient operations add more value.</li>
                  </ul><br />

                  <h4>How We Valuate:</h4>
                  <ul className="list-disc list-outside pl-6">
                    <li><strong>Comparable Company Analysis:</strong> We compare your business to others in your industry that have recently sold or are publicly traded.</li>
                    <li><strong>Discounted Cash Flow (DCF):</strong> We project future cash flow to find today’s value.</li>
                    <li><strong>Asset-Based Valuation:</strong> Sometimes it’s as simple as the assets minus liabilities.</li>
                  </ul><br />

                  <h4>Why It Matters:</h4>
                  <p>
                    A fair valuation helps sellers get the best price and buyers make smart investments. It’s all about knowing what your business is truly worth.
                  </p>

                  <p>
                    At RioPlex Business Exchange, we help make the process clear, accurate, and aligned with your goals, so whether you’re buying, selling, or planning for the future, you’ll have the right insights to move forward.
                  </p><br />

                  <Link href="/business"><Button className="mb-10 w-full max-w-[1000px]">Get My Valuation</Button></Link>
              </div>

              
              </Modal>

            </div>
    </motion.div>
  );
}
