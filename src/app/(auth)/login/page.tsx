"use client";

import { motion } from "motion/react";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";
import { CitySkyline } from "@/components/auth/city-skyline";
import { AuthForm } from "@/components/auth/auth-form";
import { FlipWords } from "@/components/motion/flip-words";
import { isFirebaseClientConfigured } from "@/lib/env";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

export default function LoginPage() {
  const reducedMotion = useSafeReducedMotion();
  const configured = isFirebaseClientConfigured();

  const handleSubmit = async (data: {
    mode: "login" | "register";
    email: string;
    password: string;
    displayName?: string;
  }) => {
    void data;
    return "Firebase Auth not yet wired. Complete T-04 to enable sign-in.";
  };

  const handleForgotPassword = async (email: string) => {
    void email;
    return "Firebase Auth not yet wired. Complete T-04 to enable password reset.";
  };

  const handleGoogleSignIn = async () => {
    return "Google sign-in not yet configured. Complete T-04 to enable.";
  };

  const skipMotion = reducedMotion;

  return (
    <div className="auth-page-root relative flex min-h-dvh overflow-hidden">
      {/* Background glow */}
      <div className="auth-page-glow absolute inset-0" aria-hidden="true" />

      {/* Top-left branding */}
      <motion.div
        className="absolute left-6 top-6 z-10"
        initial={skipMotion ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <CivicPulseLogo variant="light" showTagline />
      </motion.div>

      {/* Top-right disclaimer */}
      <div className="absolute right-6 top-7 z-10 hidden items-center gap-2 md:flex">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--cp-auth-text-white-60)" }}
        >
          Independent prototype · Not affiliated with any government body
        </span>
      </div>

      {/* Auth panel — left side */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-20 md:w-[45%] md:px-12 lg:w-[38%] lg:px-16">
        <motion.div
          className="relative w-full"
          initial={skipMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="overflow-hidden rounded-xl">
            <AuthForm
              onSubmit={handleSubmit}
              onForgotPassword={handleForgotPassword}
              onGoogleSignIn={configured ? handleGoogleSignIn : undefined}
              firebaseConfigured={configured}
            />
          </div>
        </motion.div>
      </div>

      {/* City skyline — right side */}
      <div className="absolute inset-y-0 right-0 hidden w-[55%] md:block lg:w-[62%]">
        <motion.div
          className="h-full w-full"
          initial={skipMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.1 }}
        >
          <CitySkyline className="h-full w-full" />
        </motion.div>

        {/* Headline overlay with FlipWords */}
        <motion.div
          className="absolute bottom-[20%] left-12 max-w-[520px] rounded-xl p-6 lg:left-16"
          style={{ backgroundColor: "rgba(6, 30, 45, 0.75)", backdropFilter: "blur(8px)" }}
          initial={skipMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <h2 className="auth-hero-heading text-3xl font-bold leading-[1.15] tracking-[-0.02em] lg:text-[42px]">
            Building a{" "}
            <span className="auth-hero-accent">
              <FlipWords
                words={["Smarter", "Cleaner", "Safer", "Greener"]}
                interval={2800}
              />
            </span>{" "}
            <span className="auth-hero-accent">&amp; More Responsive</span>{" "}
            City
          </h2>
          <p className="auth-text-white-70 mt-4 text-base leading-relaxed lg:text-lg">
            AI-powered civic intelligence — every report becomes a structured,
            prioritised record
          </p>
        </motion.div>
      </div>

      {/* Mobile city background */}
      <div className="pointer-events-none absolute inset-0 opacity-30 md:hidden">
        <CitySkyline className="h-full w-full" />
      </div>
    </div>
  );
}
