"use client";

import * as React from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log error with digest to console (no PII) per PRD UI-32
    console.error("Global system error:", error.message, error.digest ? `(digest: ${error.digest})` : "");
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] p-6 text-center text-[#111827] font-sans antialiased">
        <main id="main" className="mx-auto flex max-w-md flex-col items-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertOctagon className="h-8 w-8" aria-hidden="true" />
          </div>

          <span className="mb-2 font-mono text-xs font-bold tracking-wider text-red-700 uppercase">
            500 · System Failure
          </span>

          <h1 className="text-3xl font-extrabold tracking-tight text-[#111827] sm:text-4xl">
            Critical system error
          </h1>

          <p className="mt-3 text-base text-[#4B5563]">
            Something went wrong on our side. The application encountered an unexpected platform exception.
          </p>

          {error.digest && (
            <div className="mt-4 rounded border border-gray-200 bg-white px-3 py-1.5 font-mono text-xs text-gray-500">
              Digest: <span className="font-semibold text-gray-800">{error.digest}</span>
            </div>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => reset()}
              className="flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-[#0F766E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0D655E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Try again</span>
            </button>
            <Link
              href="/"
              className="flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              <span>Go home</span>
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}

