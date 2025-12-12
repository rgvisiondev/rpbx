import NavGate from '../../components/NavGate';
import Accordion from '../../../components/ui/accordion';
import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | RioPlex Business Exchange",
  description: "Common questions about business brokers, selling your business, business valuations, confidential information memorandums (CIM), seller financing, and how to find the best business broker for your needs."
};

export default function FAQ() {

  return (
    <div>
      {/* Div 1: 2 rows */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <div>
            <NavGate />
        </div>

        <div className="flex flex-col w-full lg:max-w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-2">
          <h1>Frequently Asked Questions</h1>
          <p className="-mt-2">Here are some of the most common questions about RioPlex Business Exchange memberships, business broker services, selling your business, and investment opportunities.</p>

          {/* Accordion Section */}
          <div className="gap-5 flex flex-col">

            <Accordion title="How much does it cost for a Business Valuation?">
              <p>
                Our professional small business valuation service is priced at $1,850 for non-members and $850 for members. Business Owner Lite trial members do not qualify for the member discount during their 30-day trial. Business valuations are essential when working with business brokers to sell your business or determine a fair asking price. Our valuation experts help you understand how to value a small company for sale or investment purposes.
              </p><br/>

              <p>
                Phone: +1 877-816-0013<br />
                Email: <Link href="mailto:info@rioplexbizx.com" className="green-link">info@rioplexbizx.com</Link><br />
              </p>
            </Accordion>

            <Accordion title="How does the Business Owner 30-day free trial work?">
              <p>
                You’ll have full access to the Business Owner membership for 30 days at no cost. During the trial, some features are limited — you won’t be able to view investors’ full profiles, filter or sort the investor listings, see your own business listing views, access the business valuation discount, or boost your listing. After the 30 days, your regular plan charges will automatically begin unless you cancel beforehand.
              </p>
            </Accordion>

            <Accordion title="Are there any additional costs beyond the subscription fees?">
              <p>
                No, the subscription fees cover all the features and services available through your membership. 
                There are no additional costs for using the platform’s <b>core functions</b>.
              </p>
            </Accordion>

            <Accordion title="What do the Business Member and Investor Member subscriptions include?">
              <p>
                Business Member subscriptions allow you to list your business on our platform, access investor profiles, and manage your business profile. 
                Investor Member subscriptions provide access to detailed business profiles, allowing you to evaluate investment opportunities and connect with business owners.
              </p>
            </Accordion>

            <Accordion title="What is the duration of the subscription, and how can I renew it?">
              <p>
                Subscriptions are valid for one year from the date of purchase. You will receive a renewal reminder before your subscription expires. 
                To renew, simply follow the instructions in the reminder email or visit your account settings on the platform. 
                You also have the option when registering to automatically set your membership to renew.
              </p>
            </Accordion>

            <Accordion title="What should I do if I have trouble accessing my subscription features?">
              <p>
                If you experience issues accessing subscription features, contact our support team via the contact form on our website. 
                Provide details about the problem, and our team will assist you in resolving it promptly.
              </p>
            </Accordion>

            <Accordion title="Does RioPlex Business Exchange offer discounts on memberships?">
              <p>
                Yes, RioPlex Business Exchange occasionally offers discounts on memberships. 
                Keep an eye on our website or subscribe to our newsletter for updates on promotional offers and discount opportunities.
              </p>
            </Accordion>

            <Accordion title="What is the refund policy for RioPlex Business Exchange memberships?">
              <p>
                Membership fees are generally non-refundable. 
                However, if you experience issues with your subscription or believe there has been an error, 
                please contact our support team within 30 days of purchase. 
                We will review your case and consider refunds or adjustments on a case-by-case basis.
              </p>
            </Accordion>

            <Accordion title="What is a Business Broker?">
              <p>
                A business broker is a professional who facilitates the buying and selling of businesses. Business brokers help with business valuations, prepare confidential information memorandums (CIM), match buyers with sellers, and guide parties through the transaction process including negotiations and due diligence.
              </p>
            </Accordion>

            <Accordion title="What is a Confidential Information Memorandum (CIM)?">
              <p>
                A confidential information memorandum (CIM) is a detailed document that provides comprehensive information about a business for sale. The CIM typically includes financial statements, business operations, market analysis, growth opportunities, and other key data that potential buyers need to evaluate the business. This document is essential in mergers and acquisitions and business brokerage transactions.
              </p>
            </Accordion>

            <Accordion title="How do I find the best business broker?">
              <p>
                To find the best business broker, look for professionals with experience in your industry, a proven track record of successful transactions, and strong local market knowledge. RPBX connects you with top business brokers in Texas including Houston business brokers, Austin business brokers, and small business brokers throughout the region. Our platform features business broker services tailored to your needs.
              </p>
            </Accordion>

            <Accordion title="How does seller financing work?">
              <p>
                Seller financing is when the business seller provides financing to the buyer instead of the buyer obtaining traditional bank financing. The buyer makes payments to the seller over time, typically with interest. This arrangement can make businesses more attractive to buyers and help sellers close deals faster. Seller financing often involves a seller’s note documenting the terms of the financing agreement.
              </p>
            </Accordion>

            <Accordion title="What is the difference between an asset purchase and a stock purchase?">
              <p>
                An asset purchase (asset deal) is when the buyer purchases specific assets and liabilities of a business, while a stock purchase (stock deal) involves buying the ownership shares of the company itself. Asset vs stock purchase decisions affect tax implications, liability transfer, and transaction structure. Your business broker or legal advisor can help determine which is best for your situation.
              </p>
            </Accordion>

            <Accordion title="How do I sell my business fast?">
              <p>
                To sell your business quickly, start by getting a professional business valuation, prepare a comprehensive confidential information memorandum (CIM), list your business on multiple business broker sites like RPBX, consider offering seller financing, and work with experienced business brokers who have access to qualified buyers. Proper preparation and realistic pricing are key to selling your business fast.
              </p>
            </Accordion>

            <Accordion title="Where can I find businesses for sale near me?">
              <p>
                RPBX is one of the best business broker websites for finding businesses for sale near you. Our platform features small businesses for sale, internet businesses, franchise opportunities, and more across Texas. You can search by location, industry, and other criteria to find businesses for sale that match your investment goals.
              </p>
            </Accordion>

            <Accordion title="What are the tax implications of selling a business?">
              <p>
                Selling a business has significant tax implications including capital gains tax considerations. The tax treatment differs between asset deals and stock deals. Tax on selling a business depends on factors like deal structure, holding period, and entity type. We recommend consulting with a CPA or tax advisor to understand the specific taxes when selling a business and optimize your tax strategy.
              </p>
            </Accordion>

            <Accordion title="How can I contact RioPlex Business Exchange?">
              <p>
                If you have any questions or concerns, please contact us at:
              </p><br/>
              <p>
                Phone: +1 877-816-0013<br />
                Email: <Link href="mailto:info@rioplexbizx.com" className="green-link">info@rioplexbizx.com</Link>
              </p>
            </Accordion>


          </div>
        </div>
      </div>
    </div>
  );
}
