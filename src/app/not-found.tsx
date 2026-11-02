import Link from "next/link";
import { Compass, Home, ArrowLeft } from "lucide-react";
import { CivicPulseLogo } from "@/components/auth/civicpulse-logo";

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-16 text-center"
    >
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Link href="/" className="mb-8 focus:outline-none" aria-label="CivicPulse home">
          <CivicPulseLogo size="md" variant="dark" />
        </Link>

        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </div>

        <span className="mb-2 font-mono text-xs font-bold tracking-wider text-primary uppercase">
          404 · Error
        </span>

        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Page not found
        </h1>

        <p className="mt-3 text-base text-muted">
          Check the address or go back home. The civic record or page you requested may have moved or does not exist.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <Link
            href="/"
            className="flex min-h-[44px] sm:min-h-[38px] w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Go back home</span>
          </Link>
          <Link
            href="/explore"
            className="flex min-h-[44px] sm:min-h-[38px] w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-sunken focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Explore city reports</span>
          </Link>
        </div>

        <p className="mt-12 text-xs text-muted">
          Independent prototype · Not affiliated with BBMP, BDA or any government authority.
        </p>
      </div>
    </main>
  );
}

