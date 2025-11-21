"use client";

import { useState } from "react";
import Button from "@/app/components/Button";

export default function EmailVerifiedCTA({ loginNext }: { loginNext: string }) {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <>
      <div className="mt-6 flex items-center justify-center gap-2">
        <input
          type="checkbox"
          id="verified"
          checked={isChecked}
          onChange={(e) => setIsChecked(e.target.checked)}
          className="w-4 h-4 accent-primary cursor-pointer"
          required
        />
        <label
          htmlFor="verified"
          className="text-md text-neutral-700 cursor-pointer select-none"
        >
          I have verified my email
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button
          className={`w-full ${!isChecked ? "opacity-50 cursor-not-allowed" : ""}`}
          href={isChecked ? `/login?next=${loginNext}` : undefined}
          disabled={!isChecked}
        >
          Sign in to Continue
        </Button>
      </div>
    </>
  );
}
