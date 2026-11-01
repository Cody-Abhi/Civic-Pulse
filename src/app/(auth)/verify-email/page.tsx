"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MailCheck, RefreshCw, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";
import {
  checkEmailVerifiedStatus,
  resendVerification,
  signOutClient,
  mapAuthError,
} from "@/lib/auth-client";
import { getFirebaseAuth } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState<string>("citizen@example.com");
  const [checking, setChecking] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(60);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const auth = getFirebaseAuth();
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user?.email) {
          setEmail(user.email);
          if (user.emailVerified) {
            router.replace("/citizen/dashboard");
          }
        }
      });
      return () => unsubscribe();
    } catch {
      // ignore
    }
  }, [router]);

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleCheckVerification = async () => {
    setError(null);
    setMessage(null);
    setChecking(true);

    try {
      const result = await checkEmailVerifiedStatus();
      if (result.verified) {
        router.replace(result.home || "/citizen/dashboard");
      } else {
        setError(
          "We still can't see the verification. Please open the link in the verification email sent to your inbox, then try again.",
        );
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setError(null);
    setMessage(null);
    setResending(true);

    try {
      await resendVerification();
      setMessage(
        "Verification email resent! Please check your inbox and spam folder.",
      );
      setCooldown(60);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOutClient();
    router.replace("/login");
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

      {/* Card Container (max 420px) */}
      <div className="relative z-10 w-full max-w-[420px] rounded-xl border border-white/15 bg-surface/95 p-6 shadow-xl backdrop-blur-md md:p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-5">
          <Icon icon={MailCheck} size={28} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-ink">
          Verify your email
        </h1>

        <p className="mt-2 text-sm text-muted leading-relaxed">
          We&apos;ve sent a verification link to:
          <br />
          <strong className="text-ink font-semibold">{email}</strong>
        </p>

        <p className="mt-2 text-xs text-muted">
          Verifying your email prevents spam and enables public tracking notifications on all reports you submit.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-md border border-danger/30 bg-danger-bg p-3 text-left text-xs text-danger"
          >
            <Icon icon={AlertCircle} size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-md border border-success/30 bg-success-bg p-3 text-left text-xs text-success"
          >
            <Icon icon={MailCheck} size={16} className="shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Button
            type="button"
            onClick={handleCheckVerification}
            disabled={checking}
            className="h-11 w-full gap-2 font-semibold"
          >
            {checking ? (
              <>
                <Icon icon={Loader2} size={16} className="animate-spin" />
                Checking verification...
              </>
            ) : (
              <>
                <Icon icon={RefreshCw} size={16} />
                I&apos;ve verified — continue
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="h-10 w-full text-xs font-semibold"
          >
            {resending ? (
              <>
                <Icon icon={Loader2} size={14} className="animate-spin" />
                Resending email...
              </>
            ) : cooldown > 0 ? (
              `Resend email (${cooldown}s)`
            ) : (
              "Resend email"
            )}
          </Button>

          <button
            type="button"
            onClick={handleSignOut}
            className="mt-2 text-xs text-muted hover:text-ink transition-colors flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <Icon icon={ArrowLeft} size={12} />
            Use a different account (sign out)
          </button>
        </div>
      </div>
    </div>
  );
}
