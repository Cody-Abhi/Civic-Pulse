"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Shield, Briefcase, Loader2, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { loginWithEmail, mapAuthError } from "@/lib/auth-client";
import { clientEnv } from "@/lib/env";

interface JudgeAccount {
  role: "citizen" | "authority" | "admin";
  email: string;
  password?: string;
  label: string;
  description: string;
  tour?: string;
  viewOnly?: boolean;
}

interface JudgePanelProps {
  className?: string;
}

export function JudgePanel({ className = "" }: JudgePanelProps) {
  const router = useRouter();
  const [accounts, setAccounts] = React.useState<JudgeAccount[]>([]);
  const [isFetching, setIsFetching] = React.useState<boolean>(Boolean(clientEnv.DEMO_MODE));
  const [loadingRole, setLoadingRole] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!clientEnv.DEMO_MODE) return;
    let mounted = true;
    fetch("/api/demo/credentials")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data?.accounts && Array.isArray(data.accounts)) {
          // Take the primary 3 judge roles: citizen, roads authority, and admin
          const judgeAccounts = data.accounts.slice(0, 3);
          setAccounts(judgeAccounts);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsFetching(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!clientEnv.DEMO_MODE) {
    return null;
  }

  const handleSelectRole = async (acc: JudgeAccount) => {
    if (loadingRole) return;
    setError(null);
    setLoadingRole(acc.role);

    try {
      const password = acc.password;
      if (!password) {
        throw new Error("Demo credentials currently unavailable.");
      }

      // Initialize guided tour for judge
      try {
        localStorage.setItem(
          `civicpulse_tour_${acc.role}`,
          JSON.stringify({ completed: [], dismissed: false }),
        );
      } catch {}

      const session = await loginWithEmail(acc.email, password);
      router.push(session.home);
    } catch (err) {
      setError(mapAuthError(err));
      setLoadingRole(null);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "citizen":
        return <User className="h-5 w-5 text-emerald-600" aria-hidden="true" />;
      case "authority":
        return <Briefcase className="h-5 w-5 text-blue-600" aria-hidden="true" />;
      case "admin":
        return <Shield className="h-5 w-5 text-purple-600" aria-hidden="true" />;
      default:
        return <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />;
    }
  };

  return (
    <section
      aria-label="Try it as a judge"
      className={`rounded-2xl border border-border bg-surface p-6 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border/80">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">
              Try it as a judge
            </h2>
            <p className="text-xs text-muted">
              One-click interactive guided tours for hackathon evaluation
            </p>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-sunken px-3 py-1 text-xs font-medium text-ink-secondary">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>No passwords required · Instant session</span>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 p-3 text-xs text-danger"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3 Role Cards */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        {isFetching ? (
          <div className="col-span-3 flex items-center justify-center py-8 text-xs text-muted gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading judge demo profiles...</span>
          </div>
        ) : (
          accounts.map((acc) => {
            const isLoading = loadingRole === acc.role;

            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectRole(acc)}
                disabled={Boolean(loadingRole)}
                className="group relative flex flex-col justify-between text-left rounded-xl border border-border/90 bg-surface hover:border-primary/50 hover:bg-surface-muted p-4 transition-all duration-150 focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-surface border border-border/60 shadow-xs">
                      {getRoleIcon(acc.role)}
                    </div>
                    {acc.viewOnly && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        View-Only
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-ink group-hover:text-primary transition-colors">
                    {acc.label}
                  </h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {acc.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>{isLoading ? "Starting tour..." : "Launch Tour"}</span>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

