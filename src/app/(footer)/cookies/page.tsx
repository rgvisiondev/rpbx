import NavGate from '../../components/NavGate';
import Link from 'next/link';
import Accordion from '../../../components/ui/accordion';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors"
};

export default function Cookies() {

  return (
    <div>
      {/* Div 1: 2 rows */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <div>
          <NavGate />
        </div>

        <div className="flex flex-col w-full lg:max-w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-2">
          <h1>Cookie Policy</h1>
          <p className="-mt-2">Effective Date: 9/25/24</p>

          {/* Accordion Section */}
          <div className="gap-5 flex flex-col">

            <Accordion title="1. What Are Cookies">
              <p>
                Cookies are small text files placed on your device when you visit a website. They help websites recognize your device and store some information about your preferences or past actions.
              </p>
            </Accordion>

            <Accordion title="2. How We Use Cookies">
              <p>At RioPlex Business Exchange, we use cookies in the following ways:</p>
              <ul className="list-disc list-inside mt-2">
                <li><strong>Essential Cookies:</strong> Required for core functionality such as secure login, session continuity, and form submissions. These cannot be disabled.</li>
                <li><strong>Performance & Analytics Cookies:</strong> Collect anonymous data about site usage (e.g., most visited pages, loading times) to improve user experience.</li>
                <li><strong>Functional Cookies:</strong> Remember your preferences (like language or region) to make your experience smoother.</li>
                <li><strong>Advertising & Targeting Cookies:</strong> Track browsing habits to deliver more relevant ads. These do not personally identify you.</li>
              </ul>
            </Accordion>

            <Accordion title="3. Third-Party Cookies">
              <p>
                Some features, such as analytics tools or embedded content, may place cookies from third parties (e.g., Google Analytics). These third parties manage their cookies under their own policies.
              </p>
            </Accordion>

            <Accordion title="4. Your Cookie Choices">
              <p>You can control how cookies are used on your device:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Block or delete cookies through your browser settings.</li>
                <li>Opt out of analytics with tools like the Google Analytics opt-out plugin.</li>
                <li>Manage ad preferences via digital advertising platforms.</li>
              </ul>
              <p className="mt-2">Please note that disabling cookies may reduce functionality or prevent access to certain features of our site.</p>
            </Accordion>

            <Accordion title="5. Why We Use Cookies">
              <ul className="list-disc list-inside mt-2">
                <li>To ensure the website works correctly and securely</li>
                <li>To gather insights into user behavior and improve navigation</li>
                <li>To remember your preferences for a smoother experience</li>
                <li>(If applicable) To deliver relevant marketing content</li>
              </ul>
            </Accordion>

            <Accordion title="6. Updates to This Cookie Policy">
              <p>
                We may revise this Cookie Policy from time to time to reflect changes in technology, law, or our practices. Any updates will be posted with a new “Effective Date.” We encourage you to review this page periodically.
              </p>
            </Accordion>

            <Accordion title="7. Contact Information">
              <p>
                If you have any questions about our cookie practices, please contact us at:
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
