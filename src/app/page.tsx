import Link from "next/link";
import {
  FileText,
  MapPin,
  BarChart3,
  Zap,
  Shield,
  Radar,
  Map,
  ArrowRight,
  Eye,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const STEPS = [
  {
    number: "01",
    title: "Describe the issue",
    description: "Write a free-text report. Our AI classifies it into the right category and department.",
    icon: FileText,
  },
  {
    number: "02",
    title: "Pin the location",
    description: "Drop a pin or share your GPS coordinates. We map it to the correct ward automatically.",
    icon: MapPin,
  },
  {
    number: "03",
    title: "Deterministic priority",
    description: "Seven weighted factors produce an explainable score. AI advises, but the formula decides.",
    icon: BarChart3,
  },
  {
    number: "04",
    title: "Track to resolution",
    description: "Follow your report through every status change. Get notified when action is taken.",
    icon: Eye,
  },
];

const DIFFERENTIATORS = [
  {
    title: "Priority Receipt",
    description:
      "Every complaint gets an itemised priority receipt — a transparent ledger showing exactly how the score was calculated. No black boxes.",
    icon: Shield,
  },
  {
    title: "Duplicate Radar",
    description:
      "Jaccard similarity and geohash proximity detect duplicate reports automatically, so authorities see clustered issues, not scattered noise.",
    icon: Radar,
  },
  {
    title: "Ward Pulse Map",
    description:
      "A live heatmap of civic issues by ward, with cluster markers and category filters. Built on OpenFreeMap — zero cost, full control.",
    icon: Map,
  },
];

export default function HomePage() {
  return (
    <main id="main" className="flex flex-col">
      {/* Hero */}
      <section className="bg-secondary">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-8 px-4 py-16 md:flex-row md:items-center md:gap-12 md:px-8 md:py-24">
          <div className="flex flex-1 flex-col gap-6">
            <h1 className="text-[32px] font-bold leading-[1.1] tracking-[-0.025em] text-on-primary md:text-[48px]">
              Turning citizen voices into intelligent city action
            </h1>
            <p className="max-w-[52ch] text-base leading-relaxed text-on-primary/70 md:text-lg">
              Every report becomes a structured, located, prioritised record.
              Every authority decision becomes explainable. Independent civic-tech
              prototype — not affiliated with any government body.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button size="lg" asChild>
                <Link href="/citizen/complaints/new">
                  Report an issue
                  <ArrowRight size={16} className="ml-1" />
                </Link>
              </Button>
              <Button variant="ghost" size="lg" asChild className="border border-on-primary/40 bg-transparent text-on-primary hover:bg-on-primary/10">
                <Link href="/explore/map">Explore the live map</Link>
              </Button>
            </div>
          </div>
          <div className="flex-1">
            <div
              className="flex h-[280px] items-center justify-center rounded-lg border border-on-primary/10 bg-on-primary/5 md:h-[360px]"
              aria-label="Map placeholder — MapLibre renders here once connected"
            >
              <div className="flex flex-col items-center gap-2 text-on-primary/40">
                <Icon icon={Map} size={48} />
                <span className="text-sm font-medium">Live map of Bengaluru</span>
                <span className="text-xs">Connects with OpenFreeMap</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-canvas">
        <div className="mx-auto max-w-[1360px] px-4 py-16 md:px-8 md:py-20">
          <h2 className="text-center text-[24px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
            How it works
          </h2>
          <p className="mx-auto mt-2 max-w-[48ch] text-center text-sm text-muted">
            Four steps from citizen report to city action
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <article key={step.number} className="flex flex-col gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-subtle">
                  <Icon icon={step.icon} size={20} className="text-primary" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs font-semibold text-primary">{step.number}</span>
                  <h3 className="text-base font-semibold text-ink">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-[1360px] px-4 py-16 md:px-8 md:py-20">
          <h2 className="text-[24px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
            What makes CivicPulse different
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {DIFFERENTIATORS.map((item) => (
              <article
                key={item.title}
                className="flex flex-col gap-3 rounded-md border border-border bg-canvas p-6"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-subtle">
                  <Icon icon={item.icon} size={20} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How we use AI */}
      <section className="border-t border-border bg-canvas">
        <div className="mx-auto max-w-[1360px] px-4 py-16 md:px-8 md:py-20">
          <div className="mx-auto flex max-w-[640px] flex-col items-center gap-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ai-bg">
              <Icon icon={Cpu} size={24} className="text-ink-secondary" />
            </div>
            <h2 className="text-[24px] font-bold tracking-[-0.02em] text-ink md:text-[30px]">
              How we use AI
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Gemini analyses each report to suggest a category, detect duplicates,
              and generate a plain-language summary for authorities. But AI is
              advisory only — the priority score is always deterministic, computed
              from seven weighted factors you can inspect in the Priority Receipt.
              Every AI-generated suggestion is clearly labelled.
            </p>
            <div className="mt-2 flex items-center gap-2 rounded-full bg-ai-bg px-4 py-1.5">
              <Icon icon={Zap} size={16} className="text-ink-secondary" />
              <span className="text-xs font-medium text-ink-secondary">
                Powered by Gemini · Server-side only · Your data stays private
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-4 px-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
          <p>
            Independent civic-tech prototype. Not affiliated with any government body.
          </p>
          <p>
            Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">OpenStreetMap</a> contributors · Tiles by <a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-ink">OpenFreeMap</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
