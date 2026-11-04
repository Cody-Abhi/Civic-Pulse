"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Shield, Briefcase, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Icon } from "@/components/ui/icon";
import { loginWithEmail, mapAuthError } from "@/lib/auth-client";
import { cn } from "@/lib/cn";

interface DemoAccount {
  role: "citizen" | "authority" | "admin";
  email: string;
  password?: string;
  label: string;
  description: string;
}

const DEFAULT_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "citizen",
    email: "citizen@demo.civicpulse.invalid",
    password: "CivicPulseDemo2026!",
    label: "Citizen Demo",
    description: "File reports, upvote neighbors & view Priority Receipt",
  },
  {
    role: "authority",
    email: "roads@demo.civicpulse.invalid",
    password: "CivicPulseDemo2026!",
    label: "Roads Authority Demo",
    description: "Manage priority queue, live operations map & SLAs (Roads)",
  },
  {
    role: "authority",
    email: "drainage@demo.civicpulse.invalid",
    password: "CivicPulseDemo2026!",
    label: "Drainage Authority Demo",
    description: "Triage stormwater drains, flood hazards & culvert repairs",
  },
];

interface DemoAccountPanelProps {
  className?: string;
}

export function DemoAccountPanel({ className }: DemoAccountPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams?.get("next");

  const [accounts, setAccounts] = React.useState<DemoAccount[]>(DEFAULT_DEMO_ACCOUNTS);
  const [loadingEmail, setLoadingEmail] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetch("/api/demo/credentials")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (mounted && data?.accounts && Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectAccount = async (account: DemoAccount) => {
    if (loadingEmail) return;
    setError(null);
    setLoadingEmail(account.email);

    try {
      const password = account.password || "CivicPulseDemo2026!";
      const session = await loginWithEmail(account.email, password, nextParam);
      router.replace(session.home);
    } catch (err) {
      setError(mapAuthError(err));
      setLoadingEmail(null);
    }
  };

  const getRoleIcon = (role: DemoAccount["role"]) => {
    switch (role) {
      case "citizen":
        return User;
      case "authority":
        return Briefcase;
      case "admin":
        return Shield;
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Icon icon={Sparkles} size={15} className="text-primary" />
          <span className="text-xs font-semibold tracking-wide uppercase text-white/90">
            Quick Sign In · Demo Accounts
          </span>
        </div>
        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
          Seeded Data
        </span>
      </div>

      <p className="text-xs text-white/70 mb-3 leading-relaxed">
        Test instant role-based access with verified credentials. No manual sign-up required.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-3 flex items-center gap-2 rounded-md border border-danger/40 bg-danger/15 p-2.5 text-xs text-white"
        >
          <Icon icon={AlertCircle} size={14} className="text-danger shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {accounts.map((acc) => {
          const isLoading = loadingEmail === acc.email;
          const RoleIcon = getRoleIcon(acc.role);

          return (
            <button
              key={acc.email}
              type="button"
              onClick={() => handleSelectAccount(acc)}
              disabled={Boolean(loadingEmail)}
              className={cn(
                "group relative flex items-center justify-between rounded-lg border border-white/10 bg-white/10 px-3.5 py-2.5 text-left transition-all duration-200",
                "hover:border-primary/50 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-primary/40",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-white group-hover:bg-primary group-hover:text-white transition-colors">
                  {isLoading ? (
                    <Icon icon={Loader2} size={16} className="animate-spin" />
                  ) : (
                    <Icon icon={RoleIcon} size={16} />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">
                    {acc.label}
                  </span>
                  <span className="text-[11px] text-white/60 line-clamp-1">
                    {acc.description}
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-medium text-primary group-hover:underline shrink-0 ml-2">
                {isLoading ? "Signing in…" : "Sign In →"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
