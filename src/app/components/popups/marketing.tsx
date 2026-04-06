import ContactForm from "../ContactForm";
import Link from "next/link";
import Button from "../Button";

export default function Marketing() {
    return (
        <div className="space-y-2">
            <h2>RPBX Featured Story & Media Amplification</h2><br />

            <h4>Your Voice in the Marketplace</h4>
            <p>
                Strategic storytelling and cross-platform exposure are the foundation of market authority.
                This service transforms your business narrative into earned media, brand credibility,
                and deal-flow visibility across editorial, video, social, and broadcast channels.
                By leveraging professional production and coordinated distribution, your story reaches
                investors, operators, and decision-makers actively seeking opportunities.
            </p><br />

            <h4>Key Components & Deliverables:</h4>
            <ul className="list-disc list-outside pl-6">
                <li><strong>Editorial Feature:</strong> Professionally written business profile distributed across digital media channels.</li>
                <li><strong>Short-Form Video Story:</strong> A professionally produced 60–120 second video spotlight optimized for multi-platform distribution.</li>
                <li><strong>Audio / Broadcast Interview:</strong> Featured interview segment with repurposed content for extended reach.</li>
                <li><strong>Cross-Platform Amplification:</strong> Coordinated release strategy across multiple media channels.</li>
                <li><strong>Tiered Investment Options:</strong> Starter Visibility ($2,500), Growth Authority ($4,500), and Signature Market Leader ($7,500).</li>
            </ul><br />

            <h4>Why Media Amplification Matters:</h4>
            <p>
                In a competitive market, visibility drives opportunity.
                Businesses that are seen, trusted, and talked about attract stronger deal flow,
                better partnerships, and higher-quality investor interest.
                These features position you not just as a business owner—but as a recognized operator in your market.
            </p><br />

            <p>
                This service combines strategic storytelling with distribution expertise to position your business
                for growth, credibility, and long-term opportunity.
            </p><br />

            <div className="flex flex-row gap-2 mb-8">
                <Link href="/media-amplification">
                    <Button className="w-full mt-2 cursor-pointer">View Packages</Button>
                </Link>
            </div>

            <hr className="mb-6" />

            <h2>Contact Form</h2><br />

            <h4>Amplify Your Market Presence</h4>
            <p>
                Let your story drive your business forward.
                From editorial features to broadcast-level exposure,
                we manage your media presence so you can focus on leading your business.
            </p><br />

            <ContactForm
                to="info@rioplexbizx.com"
                name="RPBX"
                subject="RPBX Contact Form Submission - Marketing Inquiry"
            />
        </div>
    );
}