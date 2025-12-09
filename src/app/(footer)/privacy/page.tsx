import NavGate from '../../components/NavGate';
import Link from 'next/link';
import Accordion from '../../../components/ui/accordion';
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "Privacy Policy | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors"
};

export default function Privacy() {

  return (
    <div>
      {/* Div 1: 2 rows */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <div>
          <NavGate />
        </div>

        <div className="flex flex-col w-full lg:max-w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-2">
          <h1>Privacy Policy</h1>
          <p className="-mt-2">Effective Date: 9/25/24</p>

          {/* Accordion Section */}
          <div className="gap-5 flex flex-col">

            <Accordion title="Introduction">
              <p>
                At RioPlex Business Exchange (“RioPlex,” “we,” “us,” or “our”), we are committed to protecting your privacy and ensuring that your personal information is handled in a safe and responsible manner.
                This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you use our website, services, and products (collectively, the “Services”).
                By accessing or using our Services, you agree to the terms of this Privacy Policy. If you do not agree with this policy, please discontinue use of our Services.
              </p>
            </Accordion>

            <Accordion title="1. Information We Collect">
              <p>We collect several types of information to provide you with the best possible experience. This information may include:</p>

              <p><strong>Personal Information</strong></p>
              <ul className="list-disc list-inside mt-2">
                <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, phone number, and other details necessary for your profile.</li>
                <li><strong>Business Information:</strong> If you list a business for sale or search for businesses on our platform, we may collect information related to your business or interests.</li>
              </ul>

              <p><strong>Non-Personal Information</strong></p>
              <ul className="list-disc list-inside mt-2">
                <li><strong>Device Information:</strong> Information about your device, such as your IP address, browser type, and operating system.</li>
                <li><strong>Usage Information:</strong> Details on how you use our Services, including pages viewed, links clicked, and search queries.</li>
              </ul>

              <p><strong>Cookies and Tracking Technologies</strong></p>
              <p>
                We use cookies, web beacons, and similar tracking technologies to track activity on our platform and hold certain information. You can adjust your browser settings to refuse cookies; however, this may affect the functionality of the Services.
              </p>
            </Accordion>

            <Accordion title="2. How We Use Your Information">
              <p>RioPlex uses your information for the following purposes:</p>
              <ul className="list-disc list-inside mt-2">
                <li><strong>Account Creation and Management:</strong> To register and maintain your user account.</li>
                <li><strong>Providing Services:</strong> To deliver the features and functionality of our Services, including business listings and communication between buyers and sellers.</li>
                <li><strong>Improving Our Services:</strong> To understand user behavior and enhance the platform experience.</li>
                <li><strong>Communication:</strong> To send you updates, marketing communications, and notifications related to your account or transactions.</li>
                <li><strong>Legal Obligations:</strong> To comply with legal obligations, resolve disputes, and enforce our agreements.</li>
              </ul>
            </Accordion>

            <Accordion title="3. How We Share Your Information">
              <p>We do not sell or rent your personal information to third parties. However, we may share your information in the following situations:</p>
              <ul className="list-disc list-inside mt-2">
                <li><strong>With Business Partners and Service Providers:</strong> We may share your information with trusted third-party vendors who assist in operating our Services, conducting our business, or providing services to you.</li>
                <li><strong>In Connection with Business Transactions:</strong> If RioPlex is involved in a merger, acquisition, or asset sale, your information may be transferred as part of that transaction.</li>
                <li><strong>For Legal Purposes:</strong> We may disclose your information to comply with applicable laws, regulations, legal processes, or governmental requests, or to protect our rights or the rights of others.</li>
              </ul>
            </Accordion>

            <Accordion title="4. Your Choices and Rights">
              <p>You have certain rights and choices regarding your personal information:</p>
              <ul className="list-disc list-inside mt-2">
                <li><strong>Access and Update:</strong> You may access and update your account information at any time by logging into your account.</li>
                <li><strong>Opt-Out:</strong> You may opt out of receiving marketing communications from us by following the unsubscribe instructions provided in such communications.</li>
                <li><strong>Cookies:</strong> You may control cookies through your browser settings and other tools.</li>
              </ul>
            </Accordion>

            <Accordion title="5. Data Security">
              <p>
                RioPlex takes reasonable measures to protect your personal information against unauthorized access, use, alteration, and destruction. However, no data transmission over the internet or electronic storage is completely secure.
              </p>
              <p>
                While we strive to protect your information, we cannot guarantee its absolute security.
              </p>
            </Accordion>

            <Accordion title="6. Data Retention">
              <p>
                We retain your personal information for as long as is necessary to provide our Services, comply with legal obligations, resolve disputes, and enforce our policies.
              </p>
              <p>
                When your information is no longer required, we will take steps to securely delete or anonymize it.
              </p>
            </Accordion>

            <Accordion title="7. Third-Party Links">
              <p>
                Our Services may contain links to third-party websites and services that are not operated by us. We have no control over these websites and are not responsible for their content, privacy policies, or practices.
              </p>
              <p>
                We encourage you to review the privacy policies of any third-party sites you visit.
              </p>
            </Accordion>

            <Accordion title="8. Children's Privacy">
              <p>
                Our Services are not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children under 18.
              </p>
              <p>
                If we learn that we have inadvertently collected personal information from a child under 18, we will take steps to delete that information as soon as possible.
              </p>
            </Accordion>

            <Accordion title="9. Changes to This Privacy Policy">
              <p>
                RioPlex may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons.
              </p>
              <p>
                We will notify you of any significant changes by posting the updated policy on our platform and updating the “Effective Date” at the top.
              </p>
              <p>
                Your continued use of our Services after any changes indicates your acceptance of the new policy.
              </p>
            </Accordion>

            <Accordion title="10. Contact Information">
              <p>
                If you have any questions or concerns about this Privacy Policy or our privacy practices, please contact us at:
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
