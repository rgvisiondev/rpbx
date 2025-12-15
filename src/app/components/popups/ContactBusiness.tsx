import ContactFormBusiness from "../ContactFormBusiness";

export default function ContactBusiness({ 
    name, 
    email, 
    businessName, 
    investorName,
    investorOrganization,
    investorIndustry,
    investorLocation
}: { 
    name?: string; 
    email?: string; 
    businessName?: string; 
    investorName?: string;
    investorOrganization?: string;
    investorIndustry?: string;
    investorLocation?: string;
}) {
    return (
        <div className="space-y-2">

            <h2>Contact Now</h2><br />
            <h4>Connect Directly With This Business</h4>
            <p>Share your investment interests, outline your value as a partner, and start a conversation about potential collaboration.
            <br /><br />
                Reach the business owner securely through RioPlex Business Exchange by completing the form below.
            </p><br />


            <ContactFormBusiness 
                businessEmail={email || ''} 
                businessName={businessName}
                investorName={investorName}
                investorOrganization={investorOrganization}
                investorIndustry={investorIndustry}
                investorLocation={investorLocation}
            />
        </div>
    );
}