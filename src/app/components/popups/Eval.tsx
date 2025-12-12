import EvaluationCheckoutButton from "../EvaluationCheckoutButton";

export default function Eval() {
    return (
        <div className="space-y-2">
            <h2>Business Valuation Services</h2><br />
            <h4>What is Business Valuation?</h4>
            <p>
                Business valuation is the process of determining what a company is worth—essential for sellers and investors. Whether you’re ready to sell your business or preparing to list your business for sale, accurate small business valuations are crucial. Our professional valuations help you understand how to value a small company and prepare for successful transactions including seller financing arrangements.
            </p><br />

            <h4>Key Components We Look At:</h4>
            <ul className="list-disc list-outside pl-6">
                <li><strong>Financials:</strong> We analyze the business’s revenue, profits, debts, and cash flow—critical for CIM preparation and investor presentations.</li>
                <li><strong>Industry &amp; Market Trends:</strong> We look at how the market and competitors are performing. This helps gauge how well your business stands in the current landscape.</li>
                <li><strong>Assets &amp; Liabilities:</strong> This includes tangible assets (like equipment) and intangible ones (like patents or brand reputation), as well as debts and other obligations.</li>
                <li><strong>Operations &amp; Customers:</strong> How well does the business run? Is the customer base stable? Recurring revenue streams and efficient operations add more value.</li>
            </ul><br />

            <h4>How We Valuate:</h4>
            <ul className="list-disc list-outside pl-6">
                <li><strong>Comparable Company Analysis:</strong> We compare your business to others in your industry that have recently sold or are publicly traded.</li>
                <li><strong>Discounted Cash Flow (DCF):</strong> We project future cash flow to find today’s value.</li>
                <li><strong>Asset-Based Valuation:</strong> Sometimes it’s as simple as the assets minus liabilities.</li>
            </ul><br />

            <h4>Why It Matters:</h4>
            <p>
                A fair valuation helps sellers get the best price and buyers make smart investments. It’s essential whether you’re preparing a confidential information memorandum (CIM) or exploring businesses for sale with seller financing.
            </p>

            <p>
                At RPBX, we help business owners get accurate valuations for mergers and acquisitions, business sales, and investment decisions. Whether you’re selling a manufacturing business or small business, our platform provides the insights you need.
            </p><br />
            <EvaluationCheckoutButton color="green" />
        </div>
    );
}