// src/app/subscribe/[lookup]/subscribe-form.tsx
"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import Button from "../../components/Button";

export function SubscribeForm({ lookup, trialDays = 0 }: { lookup: string; trialDays?: number; }) {
  const [showPw, setShowPw] = React.useState(false);

  return (
    <form method="post" action="/api/subscribe" className="mt-6 space-y-3">
      <input name="lookup" type="hidden" value={lookup} />
      {trialDays > 0 && (
        <input name="trial_days" type="hidden" value={trialDays} />
      )}

      <label className="block">
        <span>First name</span>
        <input
          name="first_name"
          required
          className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
        />
      </label>

      <label className="block">
        <span>Last name</span>
        <input
          name="last_name"
          required
          className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
        />
      </label>

      <label className="block">
        <span>Username</span>
        <input
          name="username"
          required
          className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
        />
      </label>

      <label className="block">
        <span>Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full border rounded px-3 py-2 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
        />
      </label>

      <label className="block">
        <span>Password</span>
        <div className="relative mt-1">
          <input
            name="password"
            type={showPw ? "text" : "password"}
            required
            autoComplete="new-password"
            className="w-full border rounded px-3 py-2 pr-10 focus:ring-2 focus:ring-[#9ed3c3] outline-none"
          />
          <button
            type="button"
            aria-label={showPw ? "Hide password" : "Show password"}
            onClick={() => setShowPw((s) => !s)}
            className="absolute inset-y-0 right-2 flex items-center"
          >
            {showPw ? (
              <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
            ) : (
              <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
            )}
          </button>
        </div>
      </label>

      <Button className="w-full">Continue to secure checkout</Button>
    </form>
  );
}