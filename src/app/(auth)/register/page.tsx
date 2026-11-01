"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";
import { CitySkyline } from "@/components/auth/city-skyline";
import { cn } from "@/lib/cn";
import { registerWithEmail, loginWithGoogle, mapAuthError } from "@/lib/auth-client";
import { isFirebaseClientConfigured } from "@/lib/env";

export default function RegisterPage() {
  const router = useRouter();
  const configured = isFirebaseClientConfigured();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [homeArea, setHomeArea] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: "None", color: "bg-border text-muted" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[a-zA-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: "Weak", color: "bg-danger text-danger" };
      case 2:
        return { score: 50, label: "Fair", color: "bg-warning text-warning" };
      case 3:
        return { score: 75, label: "Good", color: "bg-primary text-primary" };
      case 4:
        return { score: 100, label: "Strong", color: "bg-success text-success" };
      default:
        return { score: 0, label: "None", color: "bg-border text-muted" };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2 || name.trim().length > 60) {
      setError("Please enter your name (2–60 characters).");
      return;
    }

    if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Use at least 8 characters with both letters and numbers.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!agreed) {
      setError("Please accept the terms to continue.");
      return;
    }

    setLoading(true);

    try {
      await registerWithEmail({
        email: email.trim(),
        pass: password,
        displayName: name.trim(),
        homeWardId: homeArea.trim() || undefined,
      });
      router.push("/verify-email");
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!configured || googleLoading) return;
    setError(null);
    setGoogleLoading(true);
    try {
      const session = await loginWithGoogle();
      router.replace(session.home);
    } catch (err) {
      setError(mapAuthError(err));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page-root relative flex min-h-dvh overflow-hidden bg-secondary">
      {/* Background glow overlay */}
      <div className="auth-page-glow absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Top Bar Branding */}
      <div className="absolute left-6 top-6 z-20 flex items-center gap-3">
        <Link href="/" className="focus:outline-none">
          <CivicPulseLogo variant="light" showTagline />
        </Link>
      </div>

      {/* Top-right Disclaimer */}
      <div className="absolute right-6 top-7 z-20 hidden items-center gap-2 md:flex">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
          Independent prototype · Not affiliated with any government body
        </span>
      </div>

      {/* Split layout */}
      <div className="relative z-10 flex min-h-dvh w-full flex-col md:flex-row">
        {/* Left Side: Register Card */}
        <div className="flex w-full flex-col items-center justify-center px-6 py-24 md:w-[50%] md:px-12 lg:w-[45%] lg:px-16">
          <div className="w-full max-w-[440px] rounded-xl border border-white/15 bg-surface/95 p-6 shadow-xl backdrop-blur-md md:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Create your account
            </h1>
            <p className="mt-1 text-xs md:text-sm text-muted">
              Join CivicPulse to file transparent civic reports and track their resolution.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2 rounded-md border border-danger/30 bg-danger-bg p-3 text-xs text-danger"
              >
                <Icon icon={AlertCircle} size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Quick Sign-Up */}
            {configured && (
              <div className="mt-5">
                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={loading || googleLoading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-canvas text-sm font-medium text-ink transition-colors hover:bg-surface-elevated disabled:opacity-50"
                >
                  {googleLoading ? (
                    <Icon icon={Loader2} size={16} className="animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor" opacity="0.7" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" opacity="0.5" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" opacity="0.6" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" opacity="0.8" />
                    </svg>
                  )}
                  Continue with Google
                </button>

                <div className="my-4 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted">or continue with email</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className={cn("flex flex-col gap-3.5", !configured && "mt-5")}>
              {/* Full Name */}
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-name" className="text-xs font-semibold text-ink">
                  Full name
                </label>
                <div className="relative">
                  <Icon
                    icon={User}
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="reg-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="h-10 w-full rounded-md border border-border bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-email" className="text-xs font-semibold text-ink">
                  Email address
                </label>
                <div className="relative">
                  <Icon
                    icon={Mail}
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="reg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="priya@example.com"
                    className="h-10 w-full rounded-md border border-border bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="reg-password" className="text-xs font-semibold text-ink">
                    Password
                  </label>
                  <span className={cn("text-[11px] font-semibold", strength.color.split(" ")[1])}>
                    Strength: {strength.label}
                  </span>
                </div>
                <div className="relative">
                  <Icon
                    icon={Lock}
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 chars with letters & numbers"
                    className="h-10 w-full rounded-md border border-border bg-canvas pl-9 pr-10 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon icon={showPassword ? EyeOff : Eye} size={15} />
                  </button>
                </div>
                {/* Visual strength bar */}
                <div className="h-1 w-full overflow-hidden rounded-full bg-border mt-1">
                  <div
                    className={cn("h-full transition-all duration-300", strength.color.split(" ")[0])}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-confirm" className="text-xs font-semibold text-ink">
                  Confirm password
                </label>
                <div className="relative">
                  <Icon
                    icon={Lock}
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="reg-confirm"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="h-10 w-full rounded-md border border-border bg-canvas pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Optional Home Ward */}
              <div className="flex flex-col gap-1">
                <label htmlFor="reg-ward" className="text-xs font-semibold text-ink">
                  Home ward (Bengaluru, optional)
                </label>
                <input
                  id="reg-ward"
                  type="text"
                  value={homeArea}
                  onChange={(e) => setHomeArea(e.target.value)}
                  placeholder="e.g. Ward 150 - Bellandur"
                  className="h-10 w-full rounded-md border border-border bg-canvas px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Consent Checkbox */}
              <div className="mt-1 flex items-start gap-2.5">
                <input
                  id="reg-consent"
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="reg-consent" className="text-xs text-muted leading-relaxed">
                  I agree to the{" "}
                  <Link href="/about#privacy" className="text-primary hover:underline font-medium">
                    Privacy notice
                  </Link>{" "}
                  and understand this is an independent civic prototype.
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="mt-3 h-11 w-full font-semibold"
              >
                {loading ? (
                  <>
                    <Icon icon={Loader2} size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="mt-5 border-t border-border pt-4 text-center text-xs text-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Informative Visual Side */}
        <div className="relative hidden flex-1 flex-col justify-between overflow-hidden p-12 md:flex lg:p-16">
          <div className="relative z-10 max-w-[540px] pt-16">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              <Icon icon={ShieldCheck} size={14} className="text-primary" />
              Verified Citizen Identity
            </div>

            <h2 className="mt-4 text-3xl font-bold leading-[1.2] tracking-tight text-white lg:text-[40px]">
              Every Citizen Voice Structured for Direct Municipal Impact
            </h2>

            <p className="mt-4 text-base leading-relaxed text-white/80 lg:text-lg">
              Report local hazards, upvote existing neighborhood issues on the Duplicate Radar, and
              receive real-time updates as ward teams resolve them.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-3 text-white backdrop-blur-sm">
                <Icon icon={CheckCircle2} size={20} className="text-primary shrink-0" />
                <span className="text-sm">Transparent, deterministic Priority Receipt on every ticket</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-3 text-white backdrop-blur-sm">
                <Icon icon={CheckCircle2} size={20} className="text-primary shrink-0" />
                <span className="text-sm">Never auto-merged duplicate queue protection</span>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-3 text-white backdrop-blur-sm">
                <Icon icon={CheckCircle2} size={20} className="text-primary shrink-0" />
                <span className="text-sm">Automatic privacy scrubbing on all personal info</span>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[280px] w-full opacity-35" aria-hidden="true">
            <CitySkyline className="h-full w-full object-bottom" />
          </div>
        </div>
      </div>
    </div>
  );
}
