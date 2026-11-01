"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Eye, EyeOff, Shield, Loader2, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { AnimatedTabs } from "@/components/motion/animated-tabs";

type AuthMode = "login" | "register";

interface AuthFormProps {
  onSubmit?: (data: {
    mode: AuthMode;
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<string | undefined>;
  onForgotPassword?: ((email: string) => Promise<string | undefined>) | undefined;
  onGoogleSignIn?: (() => Promise<string | undefined>) | undefined;
  firebaseConfigured?: boolean;
  className?: string;
}

/**
 * Premium authentication card with login/register tabs.
 * Uses --cp-auth-* tokens for the dark-overlay context (no raw hex).
 */
export function AuthForm({
  onSubmit,
  onForgotPassword,
  onGoogleSignIn,
  firebaseConfigured = false,
  className,
}: AuthFormProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!onSubmit || loading) return;
      setError(null);
      setLoading(true);
      try {
        const payload = mode === "register"
          ? { mode, email, password, displayName }
          : { mode, email, password };
        const err = await onSubmit(payload);
        if (err) setError(err);
      } catch (ex) {
        setError(ex instanceof Error ? ex.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    [onSubmit, mode, email, password, displayName, loading],
  );

  const handleForgotPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!onForgotPassword || loading) return;
      setError(null);
      setLoading(true);
      try {
        const err = await onForgotPassword(email);
        if (err) {
          setError(err);
        } else {
          setForgotSent(true);
        }
      } catch (ex) {
        setError(ex instanceof Error ? ex.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    },
    [onForgotPassword, email, loading],
  );

  const handleGoogleSignIn = useCallback(async () => {
    if (!onGoogleSignIn || googleLoading) return;
    setError(null);
    setGoogleLoading(true);
    try {
      const err = await onGoogleSignIn();
      if (err) setError(err);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : "An unexpected error occurred");
    } finally {
      setGoogleLoading(false);
    }
  }, [onGoogleSignIn, googleLoading]);

  if (!firebaseConfigured) {
    return (
      <div className={cn("rounded-lg p-8 text-center", className)}>
        <p className="auth-text-white-70 text-sm">
          Firebase authentication is not configured.
          <br />
          Add Firebase credentials to enable sign-in.
        </p>
      </div>
    );
  }

  // Forgot password view
  if (forgotMode) {
    return (
      <div className={cn("auth-card w-full max-w-[420px] rounded-xl p-8", className)}>
        {forgotSent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="auth-badge-circle flex h-12 w-12 items-center justify-center rounded-full">
              <Icon icon={Mail} size={24} className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-secondary">Check your email</h2>
            <p className="auth-text-slate text-sm">
              We&apos;ve sent password reset instructions to <strong>{email}</strong>
            </p>
            <Button
              variant="ghost"
              onClick={() => { setForgotMode(false); setForgotSent(false); }}
              className="mt-2 text-primary"
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
            <button
              type="button"
              onClick={() => setForgotMode(false)}
              className="self-start text-sm font-medium text-primary hover:underline"
            >
              ← Back to sign in
            </button>
            <h2 className="text-xl font-bold text-secondary">Reset password</h2>
            <p className="auth-text-slate text-sm">
              Enter your email and we&apos;ll send you reset instructions.
            </p>
            <div className="relative">
              <Mail className="auth-input-icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="auth-input pl-10"
              />
            </div>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <Button type="submit" disabled={loading} className="h-11 w-full rounded-lg text-base font-semibold">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className={cn("auth-card w-full max-w-[420px] rounded-xl p-8", className)}>
      {/* Secure badge */}
      <div className="mb-5 flex items-center gap-1.5">
        <span className="auth-secure-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
          <Icon icon={Shield} size={14} />
          Secure &amp; Trusted
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-secondary">
        {mode === "login" ? "Welcome Back" : "Create Account"}
      </h1>
      <p className="auth-text-slate mt-1 text-sm">
        {mode === "login"
          ? "Sign in to continue to CivicPulse"
          : "Join CivicPulse to report civic issues"}
      </p>

      {/* Tabs — animated sliding indicator */}
      <AnimatedTabs
        tabs={[
          { id: "login", label: "Login" },
          { id: "register", label: "Register" },
        ]}
        activeId={mode}
        onTabChange={(id) => { setMode(id as AuthMode); setError(null); }}
        className="mt-5"
      />

      {/* Form — animated content switch */}
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <AnimatePresence mode="wait">
        {mode === "register" && (
          <motion.div
            key="name-field"
            className="relative"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full name"
              required={mode === "register"}
              className="auth-input"
              autoComplete="name"
            />
          </motion.div>
        )}
        </AnimatePresence>

        <div className="relative">
          <Mail className="auth-input-icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={18} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="auth-input pl-10"
            autoComplete="email"
          />
        </div>

        <div className="relative">
          <Lock className="auth-input-icon pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" size={18} />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            minLength={6}
            className="auth-input pl-10 pr-10"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="auth-input-icon absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors hover:opacity-70"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {mode === "login" && (
          <div className="flex items-center justify-between">
            <label className="auth-text-slate flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="auth-checkbox h-4 w-4 rounded"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => { setForgotMode(true); setError(null); }}
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot Password?
            </button>
          </div>
        )}

        {error && (
          <div className="auth-error-box rounded-md px-3 py-2 text-sm font-medium">
            {error}
          </div>
        )}

        <motion.div whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="h-12 w-full rounded-lg text-base font-semibold"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {mode === "login" ? "Signing In..." : "Creating Account..."}
              </>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </Button>
        </motion.div>
      </form>

      {/* Social sign-in */}
      {onGoogleSignIn && (
        <>
          <div className="my-5 flex items-center gap-3">
            <div className="auth-divider h-px flex-1" />
            <span className="auth-text-slate-light text-xs font-medium">or continue with</span>
            <div className="auth-divider h-px flex-1" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="auth-social-btn flex h-11 w-full items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-colors disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor" opacity="0.7" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" opacity="0.5" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" opacity="0.6" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" opacity="0.8" />
              </svg>
            )}
            Google
          </button>
        </>
      )}

      {/* Toggle auth mode */}
      <p className="auth-text-slate mt-6 text-center text-sm">
        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
          className="font-semibold text-primary hover:underline"
        >
          {mode === "login" ? "Create Account" : "Sign In"}
        </button>
      </p>
    </div>
  );
}
