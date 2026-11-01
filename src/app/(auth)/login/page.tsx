"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";
import { CitySkyline } from "@/components/auth/city-skyline";
import { AuthForm } from "@/components/auth/auth-form";
import { FlipWords } from "@/components/motion/flip-words";
import { AuroraBg } from "@/components/motion/aurora-bg";
import { BorderBeam } from "@/components/motion/border-beam";
import { ShinyText } from "@/components/motion/shiny-text";
import { isFirebaseClientConfigured } from "@/lib/env";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const configured = isFirebaseClientConfigured();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="auth-page-root relative flex min-h-dvh overflow-hidden">
      {/* Aurora glow background */}
      <AuroraBg />

      {/* Background glow (original) */}
      <div className="auth-page-glow absolute inset-0" aria-hidden="true" />

      {/* Top-left branding */}
      <motion.div
        className="absolute left-6 top-6 z-10"
        initial={prefersReduced ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <CivicPulseLogo variant="light" showTagline />
      </motion.div>

      {/* Top-right tagline */}
      <motion.div
        className="absolute right-6 top-7 z-10 hidden items-center gap-2 md:flex"
        initial={prefersReduced ? false : { opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <ShinyText className="text-sm font-medium" style={{ color: "var(--cp-auth-text-white-70)" }}>
          A Smart City Initiative
        </ShinyText>
      </motion.div>

      {/* Auth panel — left side */}
      <div className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-20 md:w-[45%] md:px-12 lg:w-[38%] lg:px-16">
        <motion.div
          className="relative w-full"
          initial={prefersReduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="relative overflow-hidden rounded-xl">
            <AuthForm
              onSubmit={handleSubmit}
              onForgotPassword={handleForgotPassword}
              onGoogleSignIn={configured ? handleGoogleSignIn : undefined}
              firebaseConfigured={configured}
            />
            <BorderBeam size={150} duration={8} delay={1} />
          </div>
        </motion.div>
      </div>

      {/* City skyline — right side */}
      <div className="absolute inset-y-0 right-0 hidden w-[55%] md:block lg:w-[62%]">
        <motion.div
          className="h-full w-full"
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.1 }}
        >
          <CitySkyline className="h-full w-full" />
        </motion.div>

        {/* Headline overlay with FlipWords */}
        <motion.div
          className="absolute left-12 top-[20%] max-w-[480px] lg:left-16"
          initial={prefersReduced ? false : { opacity: 0, y: 16 }}
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
            AI-powered civic intelligence for a better tomorrow
          </p>
        </motion.div>

        {/* Floating stat badges */}
        <motion.div
          className="absolute bottom-[28%] right-12 hidden lg:block"
          initial={prefersReduced ? false : { opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="flex flex-col gap-3">
            {[
              { label: "Issues Resolved", value: "12,847" },
              { label: "Active Citizens", value: "45,000+" },
              { label: "Avg. Response", value: "< 24hrs" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                className="flex items-center gap-3 rounded-lg px-4 py-2.5"
                style={{
                  backgroundColor: "rgba(6, 40, 61, 0.6)",
                  border: "1px solid rgba(32, 220, 203, 0.2)",
                  backdropFilter: "blur(8px)",
                }}
                initial={prefersReduced ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.4 + i * 0.15 }}
              >
                <span className="text-lg font-bold" style={{ color: "var(--cp-auth-accent)" }}>
                  {stat.value}
                </span>
                <span className="text-xs font-medium" style={{ color: "var(--cp-auth-text-white-60)" }}>
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Mobile city background */}
      <div className="pointer-events-none absolute inset-0 md:hidden">
        <div
          className="h-full w-full transition-opacity duration-1000"
          style={{ opacity: mounted ? 0.3 : 0 }}
        >
          <CitySkyline className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
