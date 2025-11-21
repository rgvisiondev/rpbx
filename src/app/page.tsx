import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import Button from "./components/Button";
import Modal from "./components/Modal";
import AuthForm from "@/components/AuthForm";
import { createClientRSC } from "@/../utils/supabase/server"
import { redirect } from "next/navigation"
import PricingTable from "./components/pricing-table";
import NewsletterSignup from "../components/ui/newsletter";
import Carousel from "../components/ui/carousel";
import HoverGif from '../components/HoverGif'
import ContactForm from "@/app/components/ContactForm";
import HomeSlider from "@/components/sliders/homeslider";

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
        <div>
          <Navbar />
        </div>

        {/* row becomes column on tablet/mobile */}
        <div className="flex flex-col lg:flex-row py-10 lg:py-0">
          <div className="flex-1 flex justify-center lg:justify-end items-center px-4 lg:p-[15px] order-2 lg:order-1">
            <div className="flex flex-col items-center w-full lg:w-[560px] max-w-lg">
              <h1 className="text-center">Unlock Your Business Potential</h1>

              <AuthForm />
            </div>
          </div>

          <div className="flex-1 lg:order-2 hidden lg:block">
            <Image
              src="/images/header/home-header.png"
              alt="Investors and Business Owners"
              width={2000}
              height={450}
              className="w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>


      {/* Div 2: 1 div containing 3 div columns */}
      
      <div className="bg-[url('/images/backgrounds/black-bg.png')] bg-cover bg-center bg-fixed lg:bg-fixed flex justify-center py-10 px-4 lg:px-0">
      <PricingTable dark={dark} loggedIn={false} />
      </div>


      {/* Div 3: 3 rows */}
      <div className="flex flex-col items-center bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top py-[15px]">
        {/* Row 1 */}
        <div className="w-full px-4 lg:w-[1140px] lg:px-0 mx-auto flex flex-col lg:flex-row gap-y-6 lg:gap-y-0 lg:gap-x-[45px] py-10">
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="flex flex-col items-start w-full lg:w-[430px] max-w-lg">
              <h2>Explore our Blog topics</h2>
              <p className="text-center lg:text-left pt-1">RPBX is here to offer you valuable knowledge. We will help guide you in making your next steps.</p>
            </div>
          </div>
          <div className="flex-1 flex justify-center lg:justify-start">
            <div className="flex flex-col items-center w-full lg:w-[660px]">
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
        <div className="flex flex-col lg:flex-row gap-y-6 lg:gap-y-0 lg:gap-x-[15px] w-full pr-4">
          <HomeSlider />

          <div className="flex-1 flex justify-center lg:justify-start">
            <div className="flex flex-col items-center text-center w-full lg:w-[560px] px-4">
              <Carousel />
            </div>
          </div>
        </div>

        {/* Row 3 */}
        <div className="w-full lg:w-[1140px] px-4 lg:px-0 flex flex-col items-center py-10">
          <h2>Business Solutions</h2>
          <p className="text-center pt-1">Connect with Our Trusted Advisors for Tailored Business Solutions</p>

          {/* four cols on desktop, two on tablet/mobile */}
          <div className="mt-4 lg:px-10 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-0 w-full">

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
              <div className="space-y-2">
                <h2>Legal Representation</h2><br />

                <h4>Protecting Your Interests in Every Transaction</h4>
                <p>
                  Every business decision carries legal implications — from structuring your company and managing assets to navigating transactions or disputes. 
                  Having a trusted legal partner ensures your business is protected, compliant, and prepared for growth.
                </p><br />

                <p>
                  That’s why the RioPlex Business Exchange has partnered with <strong>Juan Garcia</strong> and the <strong>Villeda Law Group</strong>, a respected firm with more than 40 years
                   of experience serving businesses and individuals throughout the Rio Grande Valley. Backed by a team led by Antonio Villeda, 
                   “The Valley’s Business Lawyer,” the firm combines legal expertise with practical business insight to help clients resolve challenges with confidence.
                </p><br />

                <h4>Comprehensive Legal Services Available Through Villeda Law Group</h4>
                <ul className="list-disc list-outside pl-6">
                  <li><strong>Estate Planning, Probate & Asset Protection</strong> – Safeguard your legacy and protect assets for future generations.</li>
                  <li><strong>Business & Probate Litigation</strong> – Skilled representation to defend your interests in complex disputes.</li>
                  <li><strong>IRS Representation</strong> – Guidance and advocacy for audits, disputes, and tax resolution.</li>
                  <li><strong>Business Transactions</strong>– From contract drafting to deal negotiations, ensure every transaction is legally sound.</li>
                  <li><strong>Business Immigration</strong> – Support for companies navigating employment-based immigration matters.</li>
                  <li><strong>Property Tax Representation</strong> – Reduce risk and resolve issues involving property tax challenges.</li>
                  <li><strong>Federal & State Forfeitures</strong> – Defense against government seizure actions.</li>
                  <li><strong>Cross-Border Representation</strong> – Legal support for clients with matters in Mexico.</li>
                </ul><br />

                <h4>Why Partner with Villeda Law Group?</h4>
                <p>
                  With deep roots in McAllen and fluent Spanish support, Villeda Law Group offers personalized legal strategies that align with your goals. 
                  Whether you are planning for the future, protecting assets, or managing the complexities of a business transaction, 
                  Juan Garcia and his team provide clarity, confidence, and results.
                </p><br />

                <hr className="mb-6" />

                <h2>Contact Form</h2><br />
                <h4>Request Legal Services Available Through Villeda Law Group</h4>
                <p>
                  Interested in learning how legal representation can strengthen your business? Fill out the form below, and your inquiry will go directly to Juan Garcia at the Villeda Law Group.
                </p><br />

                <ContactForm />
              </div>

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
              <div className="space-y-2">
                <h2>Certified Public Accountant & Bookkeeping Assistant</h2><br />

                <h4>Your Financial Backbone</h4>
                <p>
                  A Certified Public Accountant (CPA) and Bookkeeping Assistant play a crucial role in managing a business’s finances. 
                  They ensure your financial records are accurate, up-to-date, and compliant with regulations, allowing you to make 
                  informed decisions and maintain a healthy financial status. While CPAs focus on complex financial tasks such as 
                  tax preparation, financial planning, and auditing, bookkeeping assistants handle the day-to-day tasks of recording 
                  transactions, managing accounts payable and receivable, and reconciling bank statements.
                </p><br />

                <h4>Key Roles & Responsibilities:</h4>
                <ul className="list-disc list-outside pl-6">
                  <li><strong>Financial Record Keeping:</strong> The Bookkeeping Assistant maintains accurate and organized financial records, tracking income, expenses, and all other transactions.</li>
                  <li><strong>Tax Preparation & Compliance:</strong> A CPA ensures your business complies with tax laws, preparing and filing taxes accurately while finding potential deductions and credits.</li>
                  <li><strong>Budgeting & Forecasting:</strong> CPAs help create budgets and financial projections, allowing you to plan effectively for growth, expenses, and future investments.</li>
                  <li><strong>Financial Reporting & Analysis:</strong> Both roles work together to produce financial reports, analyze performance, and identify areas of financial improvement or risk.</li>
                  <li><strong>Payroll Management:</strong> The Bookkeeping Assistant can help manage payroll processes, ensuring employees are paid on time and accurately.</li>
                </ul><br />

                <h4>Why CPAs & Bookkeeping Assistants Matter:</h4>
                <p>
                  Having a CPA and Bookkeeping Assistant on your team ensures that your finances are managed efficiently and strategically. 
                  From staying compliant with tax laws to tracking daily transactions, they help your business make sound financial decisions, 
                  mitigate risks, and set a strong foundation for growth.
                </p><br />

                <p>
                  At RioPlex Business Exchange, we provide financial expertise through qualified CPAs and bookkeeping assistants to support 
                  your business’s financial health and growth strategy. Reach out to streamline your financial operations and make your numbers 
                  work for you!
                </p><br />

                <hr className="mb-6" />

                <h2>Contact Form</h2><br />
                <h4>Strengthen Your Financial Foundation</h4>
                <p>
                  Let your finances drive your business forward with the support of expert CPAs and BKAs from RioPlex Business Exchange. From accurate record-keeping to strategic financial planning, we help manage your finances so you can focus on growing your business.
                </p><br />


                <ContactForm />
              </div>

              </Modal>
              <h4 className="text-center mt-2">CPA &amp; Book Keeping Assistant</h4>
            </div>

          </div>
        </div>
      </div>

      {/* Div 4: 1 div */}
      <NewsletterSignup />

    </div>
  );
}
