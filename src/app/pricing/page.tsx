// app/pricing/page.tsx
import PricingTable from "../components/pricing-table";
import Accordion from "../../components/ui/accordion";
import NavGate from "../components/NavGate";
import Link from "next/link";
import { createClientRSC } from "@/../utils/supabase/server";

export default async function PricingPage() {
  const supabase = await createClientRSC();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const dark = true;

  return (
    <div>
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-center min-h-screen">
        <div>
          <NavGate />
        </div>
        <div className="mx-auto lg:max-w-[1140px] py-10 px-4 lg:px-0">
          <h1 className="text-3xl font-semibold text-center">Choose Your Plan</h1>
          <p className="mt-2 mb-8 text-sm text-neutral-500 text-center">
            Toggle between monthly and yearly billing. Business Owner Lite is free for 30 days, regular charges apply afterward.
          </p>

          {/* Pass whether the user is logged in so the table can choose flow */}
          <PricingTable dark={dark} loggedIn={!!user} />
        </div>
      </div>

      <div className="flex flex-col items-center bg-[url('/images/backgrounds/black-mint-bg.png')] bg-cover bg-center bg-fixed py-10">
        <div className="w-full overflow-visible lg:max-w-[1140px] lg:min-h-[300px] px-3 lg:px-2">
          <h2 className="text-white text-center mb-5">FAQ</h2>

          <div className="gap-5 flex flex-col">
            <Accordion title="How does the Business Owner 30-day free trial work?">
              <p>
                You&apos;ll have full access to the Business Owner membership for 30 days at no cost. During the trial, some features are limited — you won&apos;t be able to view investors&apos; full profiles, filter or sort the investor listings, see your own business listing views, access the business valuation discount, or boost your listing. After the 30 days, your regular plan charges will automatically begin unless you cancel beforehand.
              </p>
            </Accordion>

            <Accordion title="Are there any additional costs beyond the subscription fees?">
              <p>
                No, the subscription fees cover all the features and services available through your membership.
                There are no additional costs for using the platform&apos;s <b>core functions</b>. <br /><br />Optional add-ons—such as requesting a professional valuation or boosting your business listing for higher visibility—are available at an additional cost and can be purchased as needed.
              </p>
            </Accordion>

            <Accordion title="What do the Business Member and Investor Member subscriptions include?">
              <p>
                Business Member subscriptions allow you to list your business on our platform, access investor profiles, and manage your business profile.
                Investor Member subscriptions provide access to detailed business profiles, allowing you to evaluate investment opportunities and connect with business owners.
              </p>
            </Accordion>

            <Accordion title="What is the refund policy for RioPlex Business Exchange memberships?">
              <p>
                Membership fees are generally non-refundable. If you experience an issue, contact support within 30 days and we&apos;ll review it case-by-case.
              </p>
            </Accordion>

            <Accordion title="How can I contact RioPlex Business Exchange?">
              <p>If you have any questions or concerns, please contact us at:</p>
              <br />
              <p>
                Phone: (956) 322-5942<br />
                Email:{" "}
                <Link href="mailto:info@rioplexbizx.com" className="green-link">
                  info@rioplexbizx.com
                </Link>

              </p>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}
