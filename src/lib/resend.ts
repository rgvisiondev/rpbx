import { Resend } from "resend";

export function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY missing");
  return new Resend(key);
}

export function getEmailFrom() {
  return process.env.EMAIL_FROM ?? "RioPlex <notifications@rioplexbizx.com>";
}
