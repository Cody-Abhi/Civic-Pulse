import Link from "next/link";
import {
  Cpu,
  Receipt,
  CheckCircle2,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Compass,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { PublicTopbar } from "@/components/layout/public-topbar";
import { PublicFooter } from "@/components/layout/public-footer";
import { PriorityReceipt } from "@/components/ai/priority-receipt";
import { MetricStrip } from "@/components/data/metric-strip";
import { DemoBadge } from "@/components/ui/demo-badge";
import type { PriorityResult } from "@/domain/types";

// Realistic demonstration receipt for UI-01 Hero (§29.5)
const DEMO_RECEIPT: PriorityResult = {
  score: 70,
  band: "CRITICAL",
  base: 70,
  adjustment: 0,
  weightsVersion: 3,
  computedAt: new Date().toISOString(),
  provisional: false,
  factors: {
    S: 0.75,
    H: 1,
    R: 0.58,
    D: 0.21,
    A: 1,
    G: 0.4,
    T: 1,
  },
  lineItems: [
    { key: "S", label: "Severity", detail: "Drainage, base 4 of 5", factor: 0.75, weight: 0.25, points: 18.8 },
    { key: "H", label: "Safety hazard", detail: "Risk of injury reported", factor: 1, weight: 0.2, points: 20.0 },
    { key: "R", label: "Reports", detail: "4 independent citizens reported", factor: 0.58, weight: 0.15, points: 8.7 },
    { key: "D", label: "Waiting time", detail: "20 h of 48 h target", factor: 0.21, weight: 0.15, points: 3.1 },
    { key: "A", label: "Affected area", detail: "Main arterial road & school zone", factor: 1, weight: 0.1, points: 10.0 },
    { key: "G", label: "Hotspot cluster", detail: "4 other open issues within 500 m", factor: 0.4, weight: 0.1, points: 4.0 },
    { key: "T", label: "Seasonality", detail: "Monsoon active period for drainage", factor: 1, weight: 0.05, points: 5.0 },
  ],
};

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <PublicTopbar />

      <main id="main" className="flex flex-1 flex-col">
        {/* ── 1. Hero Section ── */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-surface to-canvas py-16 md:py-24">
          <div className="mx-auto max-w-[1360px] px-4 md:px-8">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
              {/* Left Copy (6 cols on desktop) */}
              <div className="flex flex-col gap-6 lg:col-span-7">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-xs">
                  <span className="flex h-2 w-2 rounded-full bg-primary" />
                  <span>Independent prototype · Bengaluru ward pilot</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl md:text-5xl lg:text-[54px] lg:leading-[1.12]">
                  See what your city needs fixing — and what gets fixed first.
                </h1>

                <p className="max-w-[62ch] text-base leading-relaxed text-ink-secondary md:text-lg">
                  CivicPulse turns citizen reports into prioritised, mapped, explainable
                  action for city teams. No black-box algorithms, no lost reports, no duplicate queues.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link href="/citizen/complaints/new">
                    <Button size="lg" className="h-12 px-6 gap-2 text-base font-semibold shadow-xs">
                      Report an issue
                      <Icon icon={ArrowRight} size={18} />
                    </Button>
                  </Link>

                  <Link href="/explore/map">
                    <Button size="lg" variant="outline" className="h-12 px-6 gap-2 text-base font-semibold">
                      <Icon icon={MapPin} size={18} />
                      Explore live map
                    </Button>
                  </Link>
                </div>

                <p className="text-xs text-muted">
                  Independent prototype · Not affiliated with BBMP, BDA or any government authority.
                </p>
              </div>

              {/* Right Signature Preview: Priority Receipt (5 cols on desktop) */}
              <div className="flex justify-center lg:col-span-5">
                <div className="w-full max-w-[420px]">
                  <PriorityReceipt
                    priority={DEMO_RECEIPT}
                    reference="CP-BLR-2611-000124"
                    variant="full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. City Pulse Strip ── */}
        <section className="border-b border-border bg-surface py-8">
          <div className="mx-auto max-w-[1360px] px-4 md:px-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider text-muted uppercase">
                  City Pulse · Bengaluru Metrics
                </h2>
                <DemoBadge size="sm" />
              </div>
              <span className="text-xs text-muted">Updated daily</span>
            </div>

            <MetricStrip
              items={[
                { label: "Reports filed", value: 1247, unit: "count" },
                { label: "Resolution rate", value: 87.3, unit: "percent", hint: "Resolved against total filed" },
                { label: "Avg. response time", value: 18.4, unit: "hours", hint: "Average hours to verified action" },
                { label: "Duplicates prevented", value: 412, unit: "count", hint: "Citizens joined existing issues" },
              ]}
            />
          </div>
        </section>

        {/* ── 3. How It Works (4-Step Sequence) ── */}
        <section className="border-b border-border bg-canvas py-16 md:py-24">
          <div className="mx-auto max-w-[1360px] px-4 md:px-8">
            <div className="mb-12 flex flex-col gap-2">
              <span className="text-xs font-bold tracking-wider text-primary uppercase">
                Workflow
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
                How CivicPulse works in 4 steps
              </h2>
              <p className="text-sm text-muted">
                A verified loop connecting citizens and municipal teams.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Step 1 */}
              <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-6 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-subtle text-primary font-bold">
                  1
                </div>
                <h3 className="text-base font-semibold text-ink">Report</h3>
                <p className="text-xs leading-relaxed text-muted">
                  Citizens submit issue descriptions with photos and an exact map pin in under 60 seconds.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-6 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-subtle text-primary font-bold">
                  2
                </div>
                <h3 className="text-base font-semibold text-ink">Understand</h3>
                <p className="text-xs leading-relaxed text-muted">
                  Server-side Gemini AI extracts categories, detects potential safety hazards, and strips PII.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-6 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-subtle text-primary font-bold">
                  3
                </div>
                <h3 className="text-base font-semibold text-ink">Prioritise</h3>
                <p className="text-xs leading-relaxed text-muted">
                  Deterministic 7-factor engine computes a transparent 0–100 score and issues a Priority Receipt.
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-6 shadow-xs">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-subtle text-primary font-bold">
                  4
                </div>
                <h3 className="text-base font-semibold text-ink">Resolve</h3>
                <p className="text-xs leading-relaxed text-muted">
                  Authority teams take action on clear queues; citizens receive status updates until closure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Three Differentiators ── */}
        <section className="border-b border-border bg-surface py-16 md:py-24">
          <div className="mx-auto max-w-[1360px] px-4 md:px-8">
            <div className="mb-14 flex flex-col gap-2 text-center md:text-left">
              <span className="text-xs font-bold tracking-wider text-primary uppercase">
                Core Innovations
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
                What makes CivicPulse fundamentally different
              </h2>
            </div>

            <div className="flex flex-col gap-16">
              {/* Diff 1: Priority Receipt */}
              <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
                    <Icon icon={Receipt} size={15} />
                    Differentiator 1
                  </div>
                  <h3 className="text-2xl font-bold text-ink">
                    The Priority Receipt: Zero Black Box
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-secondary">
                    Every complaint receives an itemised receipt explaining exactly why it is ranked
                    Critical, High, Medium, or Low. Scores are computed by audited math, not unverified AI prompts.
                  </p>
                  <ul className="flex flex-col gap-2 pt-2 text-xs text-muted">
                    <li className="flex items-center gap-2">
                      <Icon icon={CheckCircle2} size={15} className="text-success" />
                      7 deterministic factors: severity, hazards, age, multi-reporter consensus
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon={CheckCircle2} size={15} className="text-success" />
                      Fairness-capped: prevents spam brigading while protecting quiet wards
                    </li>
                  </ul>
                </div>

                <div className="rounded-md border border-border bg-canvas p-6 shadow-xs">
                  <div className="rounded-sm border border-border bg-surface p-4 text-xs">
                    <div className="flex justify-between border-b border-dashed border-border pb-2 font-mono font-bold text-muted">
                      <span>AUDITABLE FACTOR BREAKDOWN</span>
                      <span>POINTS</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span>Safety Hazard (Injury Risk)</span>
                      <span className="font-mono text-primary font-bold">+20.0</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span>Base Severity (Pothole 4/5)</span>
                      <span className="font-mono text-primary font-bold">+18.8</span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span>Waiting Time (Over SLA)</span>
                      <span className="font-mono text-primary font-bold">+12.4</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-border pt-2 font-bold text-ink">
                      <span>Total Priority Score</span>
                      <span className="font-mono text-base text-primary">70 / 100 · Critical</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Diff 2: Duplicate Radar */}
              <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                <div className="order-2 md:order-1 rounded-md border border-border bg-canvas p-6 shadow-xs">
                  <div className="flex flex-col gap-3 rounded-sm border border-border bg-surface p-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink">Duplicate Radar Alert</span>
                      <span className="rounded-xs bg-warning-bg px-2 py-0.5 font-mono text-[10px] font-semibold text-warning">
                        3 Similar Nearby Reports
                      </span>
                    </div>
                    <p className="text-muted">
                      &quot;Pothole on 100ft Road near 12th Main&quot; was reported 2 days ago by 3 neighbours.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="h-8 text-xs font-semibold">
                        Add my voice (+1)
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Report separate issue
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="order-1 md:order-2 flex flex-col gap-4">
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
                    <Icon icon={Users} size={15} />
                    Differentiator 2
                  </div>
                  <h3 className="text-2xl font-bold text-ink">
                    Duplicate Radar: Community Consensus
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-secondary">
                    Instead of flooding municipal departments with dozens of identical tickets,
                    our radar spots existing issues in real time and lets citizens add their voice.
                  </p>
                  <ul className="flex flex-col gap-2 pt-2 text-xs text-muted">
                    <li className="flex items-center gap-2">
                      <Icon icon={CheckCircle2} size={15} className="text-success" />
                      Reduces inbox clutter by up to 40%
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon={CheckCircle2} size={15} className="text-success" />
                      More voices automatically boost priority legitimately
                    </li>
                  </ul>
                </div>
              </div>

              {/* Diff 3: Ward Hotspots & AI Insights */}
              <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-xs font-semibold text-primary">
                    <Icon icon={Compass} size={15} />
                    Differentiator 3
                  </div>
                  <h3 className="text-2xl font-bold text-ink">
                    Ward Hotspots &amp; Grounded AI Insights
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-secondary">
                    Live city-wide maps reveal infrastructure stress points. Gemini AI generates
                    structured action briefs that cite verifiable numbers, never hallucinations.
                  </p>
                  <ul className="flex flex-col gap-2 pt-2 text-xs text-muted">
                    <li className="flex items-center gap-2">
                      <Icon icon={CheckCircle2} size={15} className="text-success" />
                      Direct citation of verifiable complaint counts and SLA metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <Icon icon={CheckCircle2} size={15} className="text-success" />
                      Ward-by-ward resource dispatch recommendations
                    </li>
                  </ul>
                </div>

                <div className="rounded-md border border-border bg-canvas p-6 shadow-xs">
                  <div className="flex flex-col gap-2.5 rounded-sm border border-border bg-surface p-4 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-primary">
                      <Icon icon={Cpu} size={15} />
                      <span>Gemini City Brief · Koramangala Ward 151</span>
                    </div>
                    <p className="text-ink leading-relaxed">
                      &quot;Grievances increased 28% this week, predominantly drainage (64%).
                      Recommended action: Deploy jetting equipment to 5th Block before forecast rain.&quot;
                    </p>
                    <span className="text-[10px] text-muted">
                      Source: 42 verified citizen reports · AI Advisory
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Responsible AI & Transparency Block ── */}
        <section className="bg-canvas py-16">
          <div className="mx-auto max-w-[1360px] px-4 md:px-8">
            <div className="rounded-md border border-border bg-surface p-8 shadow-xs md:p-12">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="flex flex-col gap-2 md:col-span-1">
                  <span className="text-xs font-bold tracking-wider text-primary uppercase">
                    Governance
                  </span>
                  <h2 className="text-2xl font-bold text-ink">Responsible AI Principles</h2>
                  <p className="text-xs text-muted leading-relaxed">
                    Designed from the ground up for civic trust and algorithmic safety.
                  </p>
                  <div className="pt-2">
                    <Link href="/about">
                      <Button variant="outline" size="sm" className="text-xs font-semibold">
                        Read full methodology
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 md:col-span-2">
                  <div className="flex flex-col gap-2">
                    <Icon icon={Cpu} size={22} className="text-primary" />
                    <h3 className="text-sm font-semibold text-ink">Advisory only</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Gemini suggests categories and hazards; our deterministic formula prioritises. AI never decides allocations alone.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Icon icon={ShieldCheck} size={22} className="text-primary" />
                    <h3 className="text-sm font-semibold text-ink">Strict privacy</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      All phone numbers, emails, and citizen names are stripped server-side before reaching LLM endpoints.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Icon icon={Receipt} size={22} className="text-primary" />
                    <h3 className="text-sm font-semibold text-ink">100% Explainable</h3>
                    <p className="text-xs text-muted leading-relaxed">
                      Every civic officer and citizen can inspect the exact mathematical weights behind their complaint receipt.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
