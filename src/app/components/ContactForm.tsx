'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContactForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'test@gmail.com', // temporary recipient
          subject: 'New Contact Message',
          html: `<p><b>From:</b> ${email}</p><p>${message}</p>`,
        }),
      });

      if (res.ok) {
        setStatus('success');
        setEmail('');
        setMessage('');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
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
              ? '✅ Email sent successfully!'
              : '❌ Failed to send email. Please try again.'}
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
        </form>
      </div>
    </>
  );
}
