import NavGate from '../../components/NavGate';
import Accordion from '../../../components/ui/accordion';
import Link from 'next/link';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | RioPlex Business Exchange",
  description: "Connecting Local Business Owners With Investors"
};

export default function Terms() {  

  return (
    <div>
      {/* Div 1: 2 rows */}
      <div className="flex flex-col bg-[url('/images/backgrounds/white-bg.png')] bg-repeat bg-top min-h-screen">
        <div>
            <NavGate />
        </div>

        <div className="flex flex-col w-full lg:max-w-[1140px] mx-auto py-10 gap-10 px-5 lg:px-2">
          <h1>Terms of Service</h1>
          <p className="-mt-2">Effective Date: 9/25/24</p>

          {/* Accordion Section */}
            <div className="gap-5 flex flex-col">

            <Accordion title="1. Acceptance of Terms">
                <p>
                By registering, accessing, or using any part of our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms and any other policies we publish on our platform.
                </p>
                <p>
                These Terms constitute a binding agreement between you and RioPlex.
                </p>
            </Accordion>

            <Accordion title="2. Eligibility">
                <p>To use RioPlex, you must:</p>
                <ul className="list-disc list-inside mt-2">
                <li>Be at least 18 years of age or the legal age in your jurisdiction.</li>
                <li>Have the authority to enter into legally binding agreements.</li>
                <li>Use the Services in compliance with these Terms and applicable laws.</li>
                </ul>
                <p>
                If you are using our Services on behalf of a business, you represent and warrant that you have the authority to bind that business to these Terms.
                </p>
            </Accordion>

            <Accordion title="3. Account Registration">
                <p>
                To access certain features of the platform, you will need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for any activities that occur under your account. You agree to:
                </p>
                <ul className="list-disc list-inside mt-2">
                <li>Provide accurate, current, and complete information during the registration process.</li>
                <li>Update your information to keep it accurate and current.</li>
                <li>Immediately notify RioPlex of any unauthorized use of your account or any breach of security.</li>
                </ul>
            </Accordion>

            <Accordion title="4. Use of Services">
                <p>
                You agree to use the Services only for lawful purposes and in compliance with these Terms. You agree that you will not:
                </p>
                <ul className="list-disc list-inside mt-2">
                <li>Violate any applicable laws, regulations, or third-party rights.</li>
                <li>Engage in fraudulent or deceptive practices.</li>
                <li>Post or transmit any offensive, defamatory, or harmful content.</li>
                <li>Engage in spamming or unsolicited advertising.</li>
                <li>Use automated systems (such as bots) to interact with the platform.</li>
                </ul>
                <p>
                RioPlex reserves the right to suspend or terminate your account at its sole discretion if you violate these Terms.
                </p>
            </Accordion>

            <Accordion title="5. Business Listings and Transactions">
                <p>
                <strong>Accuracy of Listings:</strong> As a business seller, you are responsible for providing accurate, truthful, and complete information about your business listing. You agree that all information provided is current, valid, and does not infringe upon any third-party rights.
                </p>
                <p>
                <strong>Transactions:</strong> RioPlex does not act as a broker or agent for any transactions. Buyers and sellers are solely responsible for negotiating, executing, and fulfilling any agreements made through the platform. RioPlex does not guarantee the accuracy of listings or the success of any business transaction.
                </p>
                <p>
                <strong>No Liability:</strong> RioPlex is not liable for any disputes, claims, losses, or damages arising out of business transactions or listings on the platform.
                </p>
            </Accordion>

            <Accordion title="6. Fees and Payments">
                <p>
                Certain services on the platform may be subject to fees. These fees will be disclosed to you prior to any transaction or service use. You agree to pay all applicable fees, and failure to do so may result in the suspension or termination of your account.
                </p>
            </Accordion>

            <Accordion title="7. Intellectual Property">
                <p>
                RioPlex owns all rights, titles, and interests in and to the Services, including all intellectual property rights. You may not copy, modify, distribute, sell, or lease any part of our Services or included software, nor may you reverse engineer or attempt to extract the source code.
                </p>
                <p>
                <strong>User-Submitted Content:</strong> By submitting any content to the platform (such as listings, comments, or feedback), you grant RioPlex a worldwide, non-exclusive, royalty-free license to use, modify, publicly display, and distribute such content in connection with providing and promoting the Services.
                </p>
            </Accordion>

            <Accordion title="8. Privacy">
                <p>
                Our Privacy Policy explains how we collect, use, and protect your personal information. By using our Services, you agree to the collection and use of information in accordance with our Privacy Policy.
                </p>
            </Accordion>

            <Accordion title="9. Disclaimers and Limitation of Liability">
                <p>
                <strong>No Warranty:</strong> The Services are provided “as is” and “as available” without any warranties, express or implied. RioPlex makes no representations or warranties of any kind, including but not limited to the accuracy, completeness, or reliability of any business listing or transaction.
                </p>
                <p>
                <strong>Limitation of Liability:</strong> To the maximum extent permitted by law, RioPlex shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of or related to your use of the Services, even if we have been advised of the possibility of such damages.
                </p>
            </Accordion>

            <Accordion title="10. Indemnification">
                <p>
                You agree to indemnify and hold harmless RioPlex and its affiliates, officers, directors, and employees from any claim, demand, loss, or damage, including reasonable attorney fees, arising out of or related to your use of the Services or violation of these Terms.
                </p>
            </Accordion>

            <Accordion title="11. Termination">
                <p>
                RioPlex reserves the right to suspend or terminate your access to the Services at any time for any reason, including but not limited to violation of these Terms or applicable laws. Upon termination, your right to use the Services will cease immediately.
                </p>
            </Accordion>

            <Accordion title="12. Governing Law">
                <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Texas, without regard to its conflict of law principles. Any legal action or proceeding arising under these Terms shall be brought exclusively in the courts located in [City], Texas.
                </p>
            </Accordion>

            <Accordion title="13. Changes to the Terms">
                <p>
                RioPlex may modify these Terms from time to time. We will notify you of significant changes by posting the updated Terms on the platform or through email. Continued use of the Services after such changes constitutes your acceptance of the new Terms.
                </p>
            </Accordion>

            <Accordion title="14. Contact Information">
              <p>
                If you have any questions or concerns about these Terms, please contact us at:
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
