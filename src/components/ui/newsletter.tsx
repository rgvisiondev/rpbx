"use client";
import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    const magicLink = `https://magic.beehiiv.com/v1/eda7b3a4-1d2e-4b31-b202-c1bb80431200?email=${encodeURIComponent(email)}&redirect_to=https://rioplexbusinessexchange.com`;

    // Redirect user
    window.location.href = magicLink;
  };

  return (
    <div className="flex flex-col items-center bg-[url('/images/backgrounds/black-mint-bg.png')] bg-cover bg-center bg-fixed py-10 px-4 lg:px-0">
      <div className="bg-white flex flex-col items-center w-full lg:w-[900px] min-h-[300px] rounded-2xl py-10 px-6 lg:px-20 mx-4 shadow-lg border-2 border-grey-500 transition-transform duration-300 hover:scale-101 hover:shadow-xl">
        <h2 className="text-center mb-2">Unlock Your Growth with Expert Insights</h2>
        <p className="text-center ">
          Join our monthly RPBX newsletter for exclusive resources, investor opportunities, and expert advice to fuel your business success. It’s free, insightful, and spam-free!
        </p>

        <form onSubmit={handleSubmit} className="w-full">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="mt-5 w-full px-6 py-2 rounded-full font-medium bg-[#EDE2E2]"
            required
          />
          <button
            type="submit"
            className="mt-5 w-full px-6 py-2 rounded-full font-medium transition bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-5 pt-2 border-t-2 border-[#A1A1A1] text-center small text-grey">
          By submitting this form, you are consenting to receive marketing emails from: info@rioplexbizx.com. You can revoke your consent to receive emails at any time by using the Unsubscribe link, found at the bottom of every email. Emails are serviced by BeeHiiv. For more information, please review our Privacy Policy and Terms of Service.
        </p>
      </div>
    </div>
  );
}
