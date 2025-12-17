import ContactForm from "../ContactForm";

export default function Legal() {
  return (
    <div className="space-y-2">
      <h2>Legal Representation</h2><br />

      <h4>Protecting Your Interests in Every Transaction</h4>
      <p>
        Every business decision carries legal implications — from structuring your company and managing assets to navigating business sales, mergers and acquisitions, or disputes.
        Whether you’re preparing to sell your business, understanding asset vs stock purchase decisions, or preparing a confidential information memorandum (CIM), having a trusted legal partner ensures your business is protected, compliant, and prepared for growth.
      </p><br />

      <p>
        That’s why the RioPlex Business Exchange has partnered with <strong>Juan Garcia</strong> and the <strong>Villeda Law Group</strong>, a respected firm with more than 40 years
        of experience serving businesses and individuals throughout the Rio Grande Valley. Backed by a team led by Antonio Villeda,
        “The Valley’s Business Lawyer,” the firm combines legal expertise with practical business insight to help clients resolve challenges with confidence.
      </p><br />

      <h4>Comprehensive Legal Services Available Through Villeda Law Group</h4>
      <ul className="list-disc list-outside pl-6">
        <li><strong>Estate Planning, Probate & Asset Protection</strong> – Safeguard your legacy and protect assets for future generations.</li>
        <li><strong>Business & Probate Litigation</strong> – Skilled representation to defend your interests in complex disputes.</li>
        <li><strong>IRS Representation</strong> – Guidance and advocacy for audits, disputes, and tax resolution.</li>
        <li><strong>Business Transactions</strong>– From contract drafting to deal negotiations, including seller financing agreements, stock versus asset purchase decisions, and confidential information memorandums (CIM) for business sales. Ensure every transaction is legally sound and properly structured.</li>
        <li><strong>Business Immigration</strong> – Support for companies navigating employment-based immigration matters.</li>
        <li><strong>Property Tax Representation</strong> – Reduce risk and resolve issues involving property tax challenges.</li>
        <li><strong>Federal & State Forfeitures</strong> – Defense against government seizure actions.</li>
        <li><strong>Cross-Border Representation</strong> – Legal support for clients with matters in Mexico.</li>
      </ul><br />

      <h4>Why Partner with Villeda Law Group?</h4>
      <p>
        With deep roots in McAllen and fluent Spanish support, Villeda Law Group offers personalized legal strategies that align with your goals.
        Whether you are planning for the future, protecting assets, or managing the complexities of a business transaction,
        Juan Garcia and his team provide clarity, confidence, and results.
      </p><br />

      <hr className="mb-6" />

      <h2>Contact Form</h2><br />
      <h4>Request Legal Services Available Through Villeda Law Group</h4>
      <p>
        Interested in learning how legal representation can strengthen your business? Fill out the form below, and your inquiry will go directly to Juan Garcia at the Villeda Law Group.
      </p><br />

      <ContactForm to="jgarcia@mybusinesslawyer.com" name="Juan Garcia" subject="RPBX Contact Form Submission - Legal Inquiry" />
    </div>
  );
}