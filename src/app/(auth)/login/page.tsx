"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";
import { CitySkyline } from "@/components/auth/city-skyline";
import { AuthForm } from "@/components/auth/auth-form";
import { DemoAccountPanel } from "@/components/auth/demo-account-panel";
import { clientEnv, isFirebaseClientConfigured } from "@/lib/env";
import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  requestPasswordReset,
  mapAuthError,
} from "@/lib/auth-client";
import { ShieldCheck, Cpu, MapPin } from "lucide-react";
import { Icon } from "@/components/ui/icon";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams?.get("next");
  const configured = isFirebaseClientConfigured();

  const handleSubmit = async (data: {
    mode: "login" | "register";
    email: string;
    password: string;
    displayName?: string;
  }): Promise<string | undefined> => {
    try {
      if (data.mode === "login") {
        const session = await loginWithEmail(data.email, data.password, nextParam);
        router.replace(session.home);
        return undefined;
      } else {
        await registerWithEmail({
          email: data.email,
          pass: data.password,
          displayName: data.displayName || "",
        });
        router.push("/verify-email");
        return undefined;
      }
    } catch (err) {
      return mapAuthError(err);
    }
  };

  const handleForgotPassword = async (email: string): Promise<string | undefined> => {
    try {
      await requestPasswordReset(email);
      return undefined;
    } catch (err) {
      return mapAuthError(err);
    }
  };

  const handleGoogleSignIn = async (): Promise<string | undefined> => {
    try {
      const session = await loginWithGoogle(nextParam);
      router.replace(session.home);
      return undefined;
    } catch (err) {
      return mapAuthError(err);
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

      {/* Top-right Disclaimer (§0, Defect 3) */}
      <div className="absolute right-6 top-7 z-20 hidden items-center gap-2 md:flex">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
          Independent prototype · Not affiliated with any government body
        </span>
      </div>

      {/* Main split layout */}
      <div className="relative z-10 flex min-h-dvh w-full flex-col md:flex-row">
        {/* Left Side: Auth Card & Demo Panel */}
        <div className="flex w-full flex-col items-center justify-center px-6 py-20 md:w-[48%] md:px-12 lg:w-[42%] lg:px-16 overflow-y-auto">
          <div className="w-full max-w-[420px] flex flex-col gap-5">
            <AuthForm
              onSubmit={handleSubmit}
              onForgotPassword={handleForgotPassword}
              onGoogleSignIn={configured ? handleGoogleSignIn : undefined}
              firebaseConfigured={configured}
            />
            {clientEnv.DEMO_MODE && <DemoAccountPanel />}
          </div>
        </div>

        {/* Right Side: Hero Visual & Differentiators (Defect 3 resolved) */}
        <div className="relative hidden flex-1 flex-col justify-between overflow-hidden p-12 md:flex lg:p-16">
          {/* Hero text area with high contrast and no overlap */}
          <div className="relative z-10 max-w-[540px] pt-16">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
              <Icon icon={ShieldCheck} size={14} className="text-primary" />
              Verified Civic Intelligence
            </div>

            <h2 className="mt-4 text-3xl font-bold leading-[1.2] tracking-tight text-white lg:text-[40px]">
              Building a Smarter, Safer &amp; More Responsive City
            </h2>

            <p className="mt-4 text-base leading-relaxed text-white/80 lg:text-lg">
              Turning citizen voices into intelligent city action. Every complaint is
              structured, located, and explainably prioritised.
            </p>

            {/* Differentiator Highlights (Replaces fabricated stats) */}
            <div className="mt-8 flex flex-col gap-3">
              <div className="flex items-start gap-3 rounded-md border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white/15 text-white">
                  <Icon icon={ShieldCheck} size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Priority Receipt</span>
                  <span className="text-xs text-white/70">
                    Transparent, deterministic 0–100 score on every report.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white/15 text-white">
                  <Icon icon={MapPin} size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Duplicate Radar</span>
                  <span className="text-xs text-white/70">
                    Surfaces nearby existing issues before submission to prevent queue inflation.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-white/15 bg-white/10 p-3.5 backdrop-blur-sm">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-white/15 text-white">
                  <Icon icon={Cpu} size={18} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">Advisory Gemini AI</span>
                  <span className="text-xs text-white/70">
                    Automated classification and hazard detection with strict human oversight.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* City Skyline docked cleanly at bottom with controlled opacity */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-[280px] w-full opacity-35"
            aria-hidden="true"
          >
            <CitySkyline className="h-full w-full object-bottom" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-secondary text-white text-sm">
          Loading authentication…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
