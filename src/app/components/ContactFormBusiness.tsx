'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TurnstileWidget, type TurnstileHandle } from './TurnstileWidget';

type ContactFormBusinessProps = {
  businessEmail: string;
  businessName?: string;
  investorName?: string;
  investorOrganization?: string;
  investorIndustry?: string;
  investorLocation?: string;
};

export default function ContactFormBusiness({
  businessEmail,
  businessName,
  investorName,
  investorOrganization,
  investorIndustry,
  investorLocation,
}: ContactFormBusinessProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Turnstile: execute-on-submit (no token stored long-term)
  const turnstileRef = useRef<TurnstileHandle>(null);

  // Guards to prevent callback loops / duplicate submits
  const submitLockRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

  async function submitWithToken(token: string) {
    // Prevent duplicate submits (callback can fire more than once)
    if (submitLockRef.current) return;
    if (lastTokenRef.current === token) return;

    submitLockRef.current = true;
    lastTokenRef.current = token;

    setStatus('sending');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/contact-business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          businessEmail,
          businessName,
          investorName,
          investorOrganization,
          investorIndustry,
          investorLocation,
          contactEmail: email,
          contactPhone: phone,
          message,
          turnstileToken: token,
        }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.error ?? 'Failed to send email. Please try again.');
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to send email. Please try again.');
      setStatus('error');
    } finally {
      // Release lock AFTER request finishes
      submitLockRef.current = false;

      // Reset so user can submit again later (tokens are single-use)
      turnstileRef.current?.reset();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    // Prevent double-clicks / rapid submits
    if (submitLockRef.current || status === 'sending') return;

    if (!email || !message || !phone) {
      setErrorMsg('Please fill out all fields');
      return;
    }

    // New click => allow a new token
    lastTokenRef.current = null;

    // Trigger Turnstile; token arrives via onVerify -> submitWithToken
    await turnstileRef.current?.execute();
  }

  // Automatically hide notification after a few seconds
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => setStatus('idle'), 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <>
      {/* === Toast Notification === */}
      <AnimatePresence>
        {(status === 'success' || status === 'error') && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-5 left-1/2 transform -translate-x-1/2 px-5 py-3 rounded-xl shadow-lg text-white font-medium z-50 ${
              status === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {status === 'success'
              ? 'Email sent successfully!'
              : 'Failed to send email. Please try again.'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* === Contact Form === */}
      <div className="w-full mb-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-gray-700"
          />

          <input
            type="tel"
            placeholder="Your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-gray-700"
          />

          <textarea
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="border border-gray-300 rounded-lg p-2 h-32 focus:outline-none focus:ring-2 focus:ring-gray-700"
          />

          <button
            type="submit"
            disabled={status === 'sending'}
            className={`rounded-full p-2 text-white transition ${
              status === 'sending'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] hover:border-[var(--color-primary-hover)]'
            }`}
          >
            {status === 'sending' ? 'Sending...' : 'Send Message'}
          </button>

          <TurnstileWidget
            ref={turnstileRef}
            action="advisor_contact"
            onVerify={(token) => submitWithToken(token)}
            onError={() => {
              // Don't unlock here; just show message. Lock is released in finally.
              setErrorMsg('Verification failed. Please try again.');
              setStatus('idle');
            }}
          />
        </form>

        {errorMsg && status === 'idle' && <p className="mt-2 text-xs text-red-600">{errorMsg}</p>}
      </div>
    </>
  );
}
