import ContactForm from "../ContactForm";

export default function ContactInvestor({ name, email }: { name?: string; email?: string }) {
    return (
        <div className="space-y-2">

            <h2>Contact {name}</h2><br />
            <h4>Connect Directly With This Investor</h4>
            <p>Introduce your business, highlight your vision, and explain what you’re seeking from an investment partner.
            <br /><br />
                Contact the investor directly using the email provided, or reach out securely through RioPlex Business Exchange by completing the form below.
            </p><br />
            <p><b>Investor Email:</b> {email}</p>


            <ContactForm to={email} subject="You Have a New Business Inquiry" />
        </div>
    );
}