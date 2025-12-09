import ContactForm from "../ContactForm";

export default function Legal() {
  return (
    <div className="space-y-2">
      <h2>Certified Public Accountant & Bookkeeping Assistant</h2><br />

      <h4>Your Financial Backbone</h4>
      <p>
        A Certified Public Accountant (CPA) and Bookkeeping Assistant play a crucial role in managing a business’s finances.
        They ensure your financial records are accurate, up-to-date, and compliant with regulations, allowing you to make
        informed decisions and maintain a healthy financial status. While CPAs focus on complex financial tasks such as
        tax preparation, financial planning, and auditing, bookkeeping assistants handle the day-to-day tasks of recording
        transactions, managing accounts payable and receivable, and reconciling bank statements.
      </p><br />

      <h4>Key Roles & Responsibilities:</h4>
      <ul className="list-disc list-outside pl-6">
        <li><strong>Financial Record Keeping:</strong> The Bookkeeping Assistant maintains accurate and organized financial records, tracking income, expenses, and all other transactions.</li>
        <li><strong>Tax Preparation & Compliance:</strong> A CPA ensures your business complies with tax laws, preparing and filing taxes accurately while finding potential deductions and credits.</li>
        <li><strong>Budgeting & Forecasting:</strong> CPAs help create budgets and financial projections, allowing you to plan effectively for growth, expenses, and future investments.</li>
        <li><strong>Financial Reporting & Analysis:</strong> Both roles work together to produce financial reports, analyze performance, and identify areas of financial improvement or risk.</li>
        <li><strong>Payroll Management:</strong> The Bookkeeping Assistant can help manage payroll processes, ensuring employees are paid on time and accurately.</li>
      </ul><br />

      <h4>Why CPAs & Bookkeeping Assistants Matter:</h4>
      <p>
        Having a CPA and Bookkeeping Assistant on your team ensures that your finances are managed efficiently and strategically.
        From staying compliant with tax laws to tracking daily transactions, they help your business make sound financial decisions,
        mitigate risks, and set a strong foundation for growth.
      </p><br />

      <p>
        At RioPlex Business Exchange, we provide financial expertise through qualified CPAs and bookkeeping assistants to support
        your business’s financial health and growth strategy. Reach out to streamline your financial operations and make your numbers
        work for you!
      </p><br />

      <h4>Contact Abby Young</h4>
      <p>
        Abby Young is a Certified Public Accountant with over a decade of experience supporting businesses, families, and nonprofits with tax strategy, financial planning, and virtual CFO guidance. As Managing Partner of Abigail Young CPA PLLC, she specializes in comprehensive accounting, forecasting, and tax preparation tailored to small and medium-sized businesses across the Rio Grande Valley. Her background in corporate accounting and financial operations allows her to provide proactive, cost-efficient financial leadership to growing organizations. Abby’s commitment to service, accuracy, and community involvement makes her a trusted resource for RPBX members seeking clarity and confidence in their financial decisions.
      </p><br />

      <hr className="mb-6" />

      <h2>Contact Form</h2><br />
      <h4>Strengthen Your Financial Foundation</h4>
      <p>
        Let your finances drive your business forward with the support of expert CPA, Abby Young! From accurate record-keeping to strategic financial planning, we help manage your finances so you can focus on growing your business.
      </p><br />


      <ContactForm to="aymurray.cpa@gmail.com" />
    </div>
  );
}