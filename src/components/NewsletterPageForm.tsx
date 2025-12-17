"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { TurnstileWidget } from "@/app/components/TurnstileWidget"

export function NewsletterPageForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email) {
      setErrorMsg("Please fill out all fields")
      return
    }
    if (!name) {
      setErrorMsg("Please enter your name")
      return
    }
    if (!turnstileToken) {
      setErrorMsg("Verification failed. Please refresh and try again")
      return
    }

    setLoading(true)

    const groups = ["172616011480041008", "172615978122740973"]

    try {
      const res = await fetch("/api/ml-subscribe-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name, email, groups, turnstileToken }),
      })

      if (res.ok) {
        setSuccess(true)
        setName("")
        setEmail("")
        setTurnstileToken(null)
      } else {
        const data = await res.json().catch(() => null)
        setErrorMsg(data?.error ?? "Failed to signup. Please try again.")
      }
    } catch {
      setErrorMsg("Failed to signup. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* LEFT: Newsletter */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col gap-2 text-center">
                <h1 className="text-2xl font-bold">
                  Business Marketplace Expert Insights
                </h1>
                <p className="text-muted-foreground text-balance">
                  Join our monthly newsletter for expert insights on selling your
                  business, business valuations, seller financing strategies, and
                  the latest businesses for sale.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                />
              </Field>

              <Field>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Submitting..." : "Sign Up"}
                </Button>
              </Field>

              <Field>
                <TurnstileWidget
                  action="newsletter"
                  onVerify={(token) => setTurnstileToken(token)}
                />
              </Field>

              {success && (
                <FieldDescription className="text-center text-green-600">
                  Thank you for subscribing!
                </FieldDescription>
              )}
              {!success && errorMsg && (
                <FieldDescription className="text-center text-red-600">
                  {errorMsg}
                </FieldDescription>
              )}
            </FieldGroup>
          </form>

          {/* RIGHT: Image */}
          <div className="bg-muted relative hidden md:block">
            <img
              src="/images/other/newsletter-section.png"
              alt="Newsletter"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center">
        By submitting this form, you agree to receive marketing emails from
        info@rioplexbizx.com. You can unsubscribe at any time. Emails are
        serviced by MailerLite.
      </FieldDescription>
    </div>
  )
}
