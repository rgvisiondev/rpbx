import ContactForm from "../ContactForm";
import Link from "next/link";
import Button from "../Button";

export default function Marketing() {
    return (
        <div className="space-y-2">
            <h2>RPBX Featured Story & Media Amplification</h2><br />

            <h4>Your Voice in the Marketplace</h4>
            <p>
                Strategic storytelling and cross-platform exposure are the foundation of market authority. Powered by the partnership between RioPlex Business Exchange and RGVision Media, this service transforms your business narrative into earned media and brand authority.
                By leveraging professional journalism and broadcast channels, we ensure your story reaches investors, entrepreneurs, and the wider Rio Grande Valley community—essential for building deal-flow visibility and long-term credibility.
            </p><br />

            <h4>Key Components & Deliverables:</h4>
            <ul className="list-disc list-outside pl-6">
                <li><strong>RGVision Magazine Feature:</strong> An editorial-style business profile with both print and digital distribution across the region.</li>
                <li><strong>Short-Form Video Story:</strong> A professionally produced 60–120 second video spotlight shared across RioPlex and RGVision channels.</li>
                <li><strong>KURV 710 Radio Interview:</strong> An on-air guest feature providing broadcast reach with repurposed audio for social content.</li>
                <li><strong>Cross-Platform Amplification:</strong> Coordinated releases across partner networks to ensure your message hits multiple touchpoints.</li>
                <li><strong>Tiered Investment Options:</strong> Flexible packages including Starter Visibility ($2,500), Growth Authority ($4,500), and Signature Market Leader ($7,500).</li>
            </ul><br />

            <h4>Why Media Amplification Matters:</h4>
            <p>
                In a competitive market, being a recognized voice is the key to building trust and opening doors to new opportunities.
                From building prestige for a future business sale to attracting new investors, these media features help you transition from a business owner to a trusted market leader.
                They mitigate the risk of being overlooked and set a strong foundation for brand growth and industry influence.
            </p><br />

            <p>
                At RioPlex Business Exchange, we provide the platform and production expertise through RGVision Media to support your business’s visibility and growth strategy.
                Reach out to streamline your media presence and make your story work for you!
            </p><br />

            <h4>About RGVision Media</h4>
            <p>
                RGVision Media is the premier media company in McAllen, TX, dedicated to showcasing the growth and innovation of the Rio Grande Valley. As the production powerhouse behind the RPBX Media Amplification suite, their team specializes in high-end editorial, video production, and strategic marketing. By combining RPBX’s business network with RGVision’s creative excellence, members receive a level of professional exposure typically reserved for major corporations. Their commitment to quality and local storytelling makes them the trusted resource for RPBX members seeking to elevate their brand and connect with the region’s most influential audiences.
            </p>
            <div className="flex flex-row gap-2 mb-8">
            <Link href="/media-amplification">
                <Button className="w-full mt-2">View Packages</Button>
            </Link>
            <Link href="https://rgvisionmedia.com" target="_blank" rel="noopener noreferrer">
                <Button className="w-full mt-2">Visit RGVision</Button>
            </Link>
            </div>

            <hr className="mb-6" />

            <h2>Contact Form</h2><br />
            <h4>Amplify Your Market Presence</h4>
            <p>
                Let your story drive your business forward with the support of RPBX and RGVision Media! From editorial features to broadcast interviews, we help manage your media presence so you can focus on leading your business.
            </p><br />


            <ContactForm to="info@rioplexbizx.com" name="RPBX" subject="RPBX Contact Form Submission - Marketing Inquiry" />
        </div>
    );
}