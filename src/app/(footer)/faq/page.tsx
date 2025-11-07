import NavGate from '../../components/NavGate';
import Accordion from '../../../components/ui/accordion';
import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors"
};

export default function FAQ() {

  return (
    <div>
      {/* Div 1: 2 rows */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <div>
            <NavGate />
        </div>

        <div className="flex flex-col w-full lg:w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-0">
          <h1>Frequently Asked Questions</h1>
          <p className="-mt-2">Here are some of the most common questions about RioPlex Business Exchange memberships and services.</p>

          {/* Accordion Section */}
          <div className="gap-5 flex flex-col">

            <Accordion title="How much does it cost for a Business Valuation?">
              <p>
                The Business Valuation is priced at $1,850 for non-members and $850 for members. Business Owner Lite trial members do not qualify for the discount during their 30-day trial. Reach out to us for more details and schedule your valuation today!
              </p><br/>

              <p>
                Phone: (956) 322-5942<br />
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

            <Accordion title="How can I contact RioPlex Business Exchange?">
              <p>
                If you have any questions or concerns, please contact us at:
              </p><br/>
              <p>
                Phone: (956) 322-5942<br />
                Email: <Link href="mailto:info@rioplexbizx.com" className="green-link">info@rioplexbizx.com</Link>
              </p>
            </Accordion>


          </div>
        </div>
      </div>
    </div>
  );
}
