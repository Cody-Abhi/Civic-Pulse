"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");
  const [cooldown, setCooldown] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading || cooldown > 0) return;

    setError(null);
    setLoading(true);

    try {
      // In production Firebase client: sendPasswordResetEmail(auth, email)
      // Anti-enumeration: always display successful notification
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSubmitted(true);
      setSubmittedEmail(email);
      setCooldown(30);
    } catch {
      setError("Unable to process request. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-secondary px-4 py-12">
      {/* Background glow overlay */}
      <div className="auth-page-glow absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Top Branding */}
      <div className="absolute left-6 top-6 z-20">
        <Link href="/" className="focus:outline-none focus:ring-2 focus:ring-primary">
          <CivicPulseLogo variant="light" showTagline={false} />
        </Link>
      </div>

      {/* Disclaimer */}
      <div className="absolute right-6 top-7 z-20 hidden md:block">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
          Independent prototype · Not affiliated with any government body
        </span>
      </div>

      {/* Auth Card Container (max 420px) */}
      <div className="relative z-10 w-full max-w-[420px] rounded-xl border border-white/15 bg-surface/95 p-6 shadow-xl backdrop-blur-md md:p-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-ink transition-colors mb-6"
        >
          <Icon icon={ArrowLeft} size={14} />
          Back to sign in
        </Link>

        {submitted ? (
          <div className="flex flex-col items-center text-center" aria-live="polite">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-success mb-4">
              <Icon icon={CheckCircle2} size={24} />
            </div>

            <h1 className="text-xl font-bold text-ink">Check your email</h1>
            <p className="mt-2 text-sm text-muted leading-relaxed">
              If an account exists for <strong className="text-ink">{submittedEmail}</strong>, we&apos;ve sent a password reset link. It expires in 1 hour.
            </p>

            <div className="mt-6 flex w-full flex-col gap-3">
              <Button
                type="button"
                variant="outline"
                disabled={cooldown > 0 || loading}
                onClick={handleSubmit}
                className="w-full text-xs font-semibold"
              >
                {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend reset link"}
              </Button>

              <Link href="/login" className="w-full">
                <Button variant="primary" className="w-full font-semibold">
                  Return to sign in
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">
                Reset your password
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                Enter your email address and we&apos;ll send you instructions to reset your password.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-md border border-danger/30 bg-danger-bg p-3 text-xs text-danger"
              >
                <Icon icon={AlertCircle} size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="reset-email" className="text-xs font-semibold text-ink">
                Email address
              </label>
              <div className="relative">
                <Icon
                  icon={Mail}
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="h-11 w-full rounded-md border border-border bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !email}
              className="mt-2 h-11 w-full font-semibold"
            >
              {loading ? (
                <>
                  <Icon icon={Loader2} size={16} className="animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
