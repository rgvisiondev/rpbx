import NavGate from '../../components/NavGate';
import Accordion from '../../../components/ui/accordion';
import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Languages | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors"
};

export default function Languages() {

  return (
    <div>
      {/* Div 1: 2 rows */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <div>
          <NavGate />
        </div>

        <div className="flex flex-col w-full lg:max-w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-2">
          <h1>Languages</h1>
          <p className="-mt-2">
            RioPlex Business Exchange is committed to creating an inclusive platform where entrepreneurs and investors can connect without barriers.
            Language accessibility plays a key role in ensuring our community can thrive together.
          </p>

          {/* Accordion Section */}
          <div className="gap-5 flex flex-col">

            <Accordion title="Currently Available">
              <p>
                At this time, all platform features, resources, and support are available in <strong>English</strong>.
                Our goal is to maintain clarity, consistency, and professionalism across all content.
                This ensures that business listings, investor profiles, and communications remain accessible and easy to navigate.
              </p>
            </Accordion>

            <Accordion title="Coming Soon">
              <p>
                We are actively working on launching a <strong>Spanish</strong> version of the platform.
                This includes translated navigation, help resources, and customer support to better serve our Spanish-speaking entrepreneurs and investors.
                The rollout will happen in phases, starting with key business listings and membership resources.
              </p>
            </Accordion>

            <Accordion title="Future Expansion">
              <p>
                As our community grows, we plan to expand into additional languages.
                Our long-term vision is to support multiple languages to empower cross-border business opportunities and collaborations.
                Suggestions from our members will help guide which languages we add next.
              </p>
            </Accordion>

            <Accordion title="Why Languages Matter">
              <p>
                We believe that breaking language barriers is essential for inclusivity, accessibility, and growth.
                By offering our services in multiple languages, we create opportunities for entrepreneurs and investors who may otherwise face limitations.
                This strengthens our mission of empowering local businesses while encouraging global connections.
              </p>
            </Accordion>

            <Accordion title="Stay Updated">
              <p>
                Subscribe to our newsletter to receive updates on new language launches, platform improvements, and upcoming features.
                As soon as new translations become available, you’ll be the first to know.
              </p>
            </Accordion>

            <Accordion title="Contact Information">
              <p>
                If you have any questions about our language support, please contact us at:
              </p><br />
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
