"use client";
import { TurnstileWidget } from "@/app/components/TurnstileWidget";
import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export function ActivateForm() {
    const lookup = process.env.NEXT_PUBLIC_STRIPE_LOOKUP_BUSINESS_LEGACY ?? "business_monthly";
    const [showPw, setShowPw] = React.useState(false);
    const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

    const formRef = React.useRef<HTMLFormElement | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (!turnstileToken){
            e.preventDefault();
            setErrorMsg("Verification failed. Please refresh and try again.");
            return;
        }

        setErrorMsg(null);
        e.preventDefault();
        formRef.current?.submit();
    }

    return (
        <form ref={formRef} method="post" action="/api/subscribe" className="space-y-4" onSubmit={handleSubmit}>
            <input name="lookup" type="hidden" value={lookup} />
            <input name="trial_days" type="hidden" value="30" />
            <input type="hidden" name="turnstile_token" value={turnstileToken ?? ""} />

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="first_name" className="block text-xs font-bold text-slate-700 uppercase mb-1">First Name</label>
                    <input type="text" id="first_name" name="first_name" placeholder="John" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#60BC9B] focus:ring-2 focus:ring-[#60BC9B]/20 outline-none transition-all font-medium text-slate-900" required />
                </div>
                <div>
                    <label htmlFor="last_name" className="block text-xs font-bold text-slate-700 uppercase mb-1">Last Name</label>
                    <input type="text" id="last_name" name="last_name" placeholder="Doe" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#60BC9B] focus:ring-2 focus:ring-[#60BC9B]/20 outline-none transition-all font-medium text-slate-900" required />
                </div>
            </div>

            <div>
                <label htmlFor="username" className="block text-xs font-bold text-slate-700 uppercase mb-1">Username</label>
                <input type="text" id="username" name="username" placeholder="JohnDoe99" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#60BC9B] focus:ring-2 focus:ring-[#60BC9B]/20 outline-none transition-all font-medium text-slate-900" required />
            </div>

            <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input type="email" id="email" name="email" placeholder="john.doe@example.com" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#60BC9B] focus:ring-2 focus:ring-[#60BC9B]/20 outline-none transition-all font-medium text-slate-900" required />
            </div>

            <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
                <input type={showPw ? "text" : "password"} id="password" name="password" placeholder="••••••••" className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#60BC9B] focus:ring-2 focus:ring-[#60BC9B]/20 outline-none transition-all font-medium text-slate-900" required />
                <button
                    type="button"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-10 pt-[15px] rounded-full focus:outline-none"
                >
                    {showPw ? (
                        <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                    ) : (
                        <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                    )}
                </button>
            </div>
            <TurnstileWidget 
                action="signup"
                onVerify={(token) => setTurnstileToken(token)}
            />

            {errorMsg && (
                <p className="text-sm text-red-600" aria-live="polite">
                {errorMsg}
                </p>
            )}

            <button type="submit" className="w-full bg-[#60BC9B] hover:bg-[#4da685] text-white font-bold py-4 rounded-full text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 group mt-6 cursor-pointer">
                Claim 30 Days Free
                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>

            <p className="small text-center text-grey">
                By joining, you agree to RPBX&apos;s <Link href="/terms" className="underline hover:text-[#60BC9B]">Terms</Link> and <Link href="/privacy" className="underline hover:text-[#60BC9B]">Privacy Policy</Link>.
            </p>
        </form>

    );
}