import type { Metadata } from "next";
import * as React from "react";
import Link from "next/link";
import { ShieldOff, LogOut, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Access Denied",
  description: "You do not have permission to access this resource.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ reason?: string }>;
}

export default async function ForbiddenPage({ searchParams }: PageProps) {
  const { reason } = await searchParams;
  const isSuspended = reason === "suspended";

  return (
    <div className="flex min-h-[100dvh] w-full flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-critical">
          <ShieldOff className="h-8 w-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {isSuspended ? "Account suspended" : "You don't have access"}
        </h1>

        <p className="mt-3 text-base text-muted-foreground">
          {isSuspended
            ? "Your account has been suspended by a municipal administrator. Please contact your platform administrator to appeal."
            : "You don't have permission to view this page with your current access level."}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="primary" className="w-full sm:w-auto">
              <LogOut className="mr-2 h-4 w-4" />
              Sign in with another account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

