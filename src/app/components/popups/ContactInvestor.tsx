import ContactFormInvestor from "../ContactFormInvestor";

export default function ContactInvestor({ name, email, businessName, industry, location, businessDescription }: { name?: string; email?: string; businessName?: string; industry?: string; location?: string; businessDescription?: string }) {
    return (
        <div className="space-y-2">

            <h2>Contact {name}</h2><br />
            <h4>Connect Directly With This Investor</h4>
            <p>Introduce your business, highlight your vision, and explain what you’re seeking from an investment partner.
            <br /><br />
                Contact the investor directly using the email provided, or reach out securely through RioPlex Business Exchange by completing the form below.
            </p><br />
            <p><b>Investor Email:</b> {email}</p>


            <ContactFormInvestor 
                investorEmail={email || ''} 
                investorName={name}
                businessName={businessName}
                industry={industry}
                location={location}
                businessDescription={businessDescription}
            />
        </div>
    );
}