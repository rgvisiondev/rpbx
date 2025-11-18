"use client";

import { useActionState } from "react";
import { requestReset } from "./actions";
import Button from "@/app/components/Button";

const initialState = { ok: false, message: "" };

export default function ForgotPasswordClient() {
  const [state, formAction] = useActionState(requestReset, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span>Email</span>
        <input
          name="email"
          type="email"
          placeholder="johndoe@example.com"
          required
          className="border p-2 w-full bg-white"
        />
      </label>

      <Button type="submit">
        Send reset link
      </Button>

      {state.message && <p>{state.message}</p>}
    </form>
  );
}
