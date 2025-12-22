// src/app/components/login-form.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle } from "@/lib/google-signin";

// ✅ Turnstile (execute-on-submit)
import { TurnstileWidget, type TurnstileHandle } from "@/app/components/TurnstileWidget";

export interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {
  next?: string;
  initialError?: string;
}

export function LoginForm({
  className,
  next = "",
  initialError,
  ...props
}: LoginFormProps) {
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(initialError ?? null);
  const [infoMsg, setInfoMsg] = React.useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = React.useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Turnstile refs + guards
  const turnstileRef = React.useRef<TurnstileHandle>(null);
  const submitLockRef = React.useRef(false);
  const lastTokenRef = React.useRef<string | null>(null);

  // We keep the form values around so the Turnstile callback can submit the login
  const pendingCredsRef = React.useRef<{ email: string; password: string } | null>(null);

  React.useEffect(() => {
    if (initialError) setErrorMsg(initialError);
  }, [initialError]);

  function mapSupabaseError(message: string) {
    const m = (message || "").toLowerCase();
    if (m.includes("invalid login") || m.includes("invalid credentials")) {
      return "Your email or password is incorrect.";
    }
    if (m.includes("email not confirmed") || m.includes("email_not_confirmed")) {
      setNeedsConfirm(true);
      return "Please verify your email to login.";
    }
    if (m.includes("too many requests") || m.includes("rate")) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    return "Something went wrong. Please try again.";
  }

  async function signInWithCreds(email: string, password: string) {
    setLoading(true);
    setNeedsConfirm(false);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    submitLockRef.current = false;
    setVerifying(false);

    // Reset Turnstile so a future login attempt gets a fresh token
    turnstileRef.current?.reset();

    if (error) {
      setErrorMsg(mapSupabaseError(error.message || "Login failed"));
      return;
    }

    router.replace(next || "/dashboard");
    router.refresh();
  }

  async function submitWithToken(token: string) {
    // Prevent duplicate submits (callback can fire more than once)
    if (submitLockRef.current) return;
    if (lastTokenRef.current === token) return;

    submitLockRef.current = true;
    lastTokenRef.current = token;

    const pending = pendingCredsRef.current;
    if (!pending?.email || !pending?.password) {
      // Nothing to submit; unlock + show error
      submitLockRef.current = false;
      setVerifying(false);
      setErrorMsg("Verification failed. Please try again.");
      turnstileRef.current?.reset();
      return;
    }

    // NOTE: Supabase signInWithPassword does not accept Turnstile directly.
    // If you want Turnstile-enforced login, you must validate token in your own API
    // and then complete auth via your own flow.
    // This implementation at least prevents repeated widget loops and lets you gate UX.
    await signInWithCreds(pending.email, pending.password);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Avoid double-submit / rapid taps
    if (loading || verifying || submitLockRef.current) return;

    setNeedsConfirm(false);
    setErrorMsg(null);
    setInfoMsg(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");

    pendingCredsRef.current = { email, password };

    // New click => allow a new token
    lastTokenRef.current = null;

    setVerifying(true);

    // Trigger Turnstile; token arrives via onVerify -> submitWithToken
    await turnstileRef.current?.execute();

    // If script isn't ready, execute() will call onError; we unset verifying there.
    setTimeout(() => {
      if (!submitLockRef.current) setVerifying(false);
    }, 0);
  }

  async function resendVerification() {
    setLoading(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const email = (document.getElementById("email") as HTMLInputElement)?.value.trim();
      if (!email) {
        setErrorMsg("Enter your email above, then tap Resend.");
        return;
      }
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) {
        setErrorMsg("Couldn't resend verification. Double-check your email.");
      } else {
        setInfoMsg("Verification email sent. Check your inbox.");
      }
    } finally {
      setLoading(false);
    }
  }

  const disableAll = loading || verifying;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Login with your Email or Google account</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signInWithGoogle("/dashboard")}
                disabled={disableAll}
              >
                Login with Google
              </Button>
            </div>

            <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
              <span className="bg-card text-muted-foreground relative z-10 px-2">
                Or continue with
              </span>
            </div>

            {/* Email / Password form */}
            <form onSubmit={onSubmit} className="grid gap-6" noValidate>
              <input type="hidden" name="next" value={next} />

              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  disabled={disableAll}
                  onChange={() => {
                    if (errorMsg) setErrorMsg(null);
                    if (infoMsg) setInfoMsg(null);
                  }}
                  className="focus:ring-2 focus:ring-[#9ed3c3]"
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    disabled={disableAll}
                    onChange={() => {
                      if (errorMsg) setErrorMsg(null);
                      if (infoMsg) setInfoMsg(null);
                    }}
                    className="pr-10 focus:ring-2 focus:ring-[#9ed3c3]"
                  />
                  <button
                    type="button"
                    aria-label={showPw ? "Hide password" : "Show password"}
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute inset-y-0 right-2 flex items-center"
                    disabled={disableAll}
                  >
                    {showPw ? (
                      <EyeOff className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-neutral-400 hover:text-neutral-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Turnstile widget (invisible, execute-on-submit) */}
              <TurnstileWidget
                ref={turnstileRef}
                action="login"
                onVerify={(token) => submitWithToken(token)}
                onError={() => {
                  // Allow retries
                  submitLockRef.current = false;
                  setVerifying(false);
                  pendingCredsRef.current = null;

                  setErrorMsg("Verification failed. Please try again.");
                  turnstileRef.current?.reset();
                }}
              />

              {(errorMsg || infoMsg) && (
                <p
                  className={`bg-red-100 small p-2 rounded-lg ${
                    errorMsg ? "text-red-600" : "text-green-600"
                  }`}
                  role="alert"
                  aria-live="polite"
                >
                  {errorMsg || infoMsg}
                </p>
              )}

              {needsConfirm && (
                <div className="flex items-center justify-between -my-3">
                  <span className="text-xs text-neutral-600">Didn’t get the email?</span>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 text-xs text-red-700 underline underline-offset-4 cursor-pointer"
                    onClick={resendVerification}
                    disabled={disableAll}
                  >
                    Resend verification
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={disableAll} aria-busy={disableAll}>
                {loading ? "Logging in..." : verifying ? "Verifying..." : "Log in"}
              </Button>
            </form>

            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href={next ? `/pricing?next=${encodeURIComponent(next)}` : "/pricing"}
                className="underline underline-offset-4"
              >
                Sign up
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <Link href="/terms">Terms of Service</Link>{" "}
        and <Link href="/privacy">Privacy Policy</Link>.
      </div>
    </div>
  );
}
