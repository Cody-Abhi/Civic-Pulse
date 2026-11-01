import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  Receipt,
  MapPin,
  Database,
  Lock,
  ArrowRight,
} from "lucide-react";
import { ReadingLayout } from "@/components/layout/reading-layout";
import { PriorityReceipt } from "@/components/ai/priority-receipt";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { DEFAULT_WEIGHTS, DUPLICATE_SETTINGS } from "@/domain/categories";
import type { PriorityResult } from "@/domain/types";

export const metadata: Metadata = {
  title: "About & Methodology | CivicPulse AI",
  description:
    "Learn how CivicPulse AI combines deterministic priority formulas, local spatial duplicate radar, and advisory Gemini AI to transform civic grievance redressal.",
};

const TOC_ITEMS = [
  { id: "mission", label: "Mission & Background" },
  { id: "how-it-works", label: "How CivicPulse Works" },
  { id: "priority-formula", label: "Priority Calculation & Receipt" },
  { id: "duplicate-radar", label: "Duplicate Radar Engine" },
  { id: "ai-methodology", label: "How We Use AI (Advisory)" },
  { id: "privacy", label: "Privacy & Data Protection" },
  { id: "data-sources", label: "Data Sources & Licences" },
  { id: "disclaimer", label: "Independent Prototype Disclaimer" },
];

const EXAMPLE_RECEIPT: PriorityResult = {
  score: 72,
  band: "CRITICAL",
  base: 72,
  adjustment: 0,
  weightsVersion: 3,
  computedAt: "2026-11-01T12:00:00.000Z",
  provisional: false,
  factors: {
    S: 0.75,
    H: 1.0,
    R: 0.6,
    D: 0.8,
    A: 0.7,
    G: 0.4,
    T: 0.2,
  },
  lineItems: [
    { key: "S", label: "Severity", factor: 0.75, weight: 0.25, points: 19, detail: "Base severity 4 of 5" },
    { key: "H", label: "Safety hazard", factor: 1.0, weight: 0.2, points: 20, detail: "Risk reported: exposed wiring, active water leak" },
    { key: "R", label: "Reports", factor: 0.6, weight: 0.15, points: 9, detail: "4 independent citizen reporters" },
    { key: "D", label: "Waiting time", factor: 0.8, weight: 0.15, points: 12, detail: "76 h of 48 h target SLA" },
    { key: "A", label: "Affected", factor: 0.7, weight: 0.1, points: 7, detail: "Affected scale 0.7 (main thoroughfare)" },
    { key: "G", label: "Hotspot", factor: 0.4, weight: 0.1, points: 4, detail: "4 other open issues within 500 m" },
    { key: "T", label: "Season", factor: 0.2, weight: 0.05, points: 1, detail: "Monsoon drain vulnerability window" },
  ],
};

export default function AboutPage() {
  return (
    <ReadingLayout tocItems={TOC_ITEMS}>
      {/* Page Header */}
      <header className="mb-10 border-b border-border pb-8">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-ink">
          <Icon icon={ShieldCheck} size={14} className="text-primary" />
          Architectural Blueprint &amp; Methodology
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink md:text-4xl">
          About CivicPulse AI
        </h1>
        <p className="mt-3 text-base text-muted md:text-lg leading-relaxed max-w-[72ch]">
          An independent civic intelligence prototype built to turn unstructured citizen
          grievances into structured, location-aware, explainably prioritised civic action.
        </p>
      </header>

      {/* 1. Mission */}
      <section id="mission" className="scroll-mt-24 mb-14">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          1. Mission &amp; Background
        </h2>
        <p className="text-sm md:text-base text-muted leading-relaxed mb-4">
          Indian metropolitan areas handle tens of thousands of citizen complaints monthly across
          solid waste management, road maintenance, streetlighting, stormwater drainage, and
          water supply. Most legacy municipal systems function as unassisted ticket inboxes: they
          accept submissions without spatial deduplication, queue them chronologically rather than
          by urgency, and provide limited visibility to citizens and field staff.
        </p>
        <p className="text-sm md:text-base text-muted leading-relaxed mb-4">
          During early 2025 in Bengaluru, the Bruhat Bengaluru Mahanagara Palike (BBMP) recorded
          over <strong>126,900 grievances</strong> in approximately 5.5 months. While streetlighting
          and garbage grievances saw higher closure rates, road repairs and complex drainage issues
          resolved at significantly lower rates (58%). CivicPulse AI explores how modern applied
          AI—grounded by deterministic algorithmic scoring—can make municipal prioritization
          transparent, equitable, and actionable.
        </p>
      </section>

      {/* 2. How it works */}
      <section id="how-it-works" className="scroll-mt-24 mb-14">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          2. How CivicPulse Works
        </h2>
        <p className="text-sm md:text-base text-muted leading-relaxed mb-4">
          CivicPulse organizes complaint lifecycle into four continuous stages:
        </p>

        <div className="flex flex-col gap-3 my-6">
          <div className="rounded-md border border-border bg-surface p-4">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 1 · Intake &amp; Local Radar</span>
            <h3 className="text-base font-semibold text-ink mt-1">Smart Intake with Real-time Duplicate Radar</h3>
            <p className="text-sm text-muted mt-1">
              As citizens describe issues and place map pins, our spatial-temporal engine surfaces nearby open complaints, allowing citizens to upvote existing issues rather than fragmenting municipal queues.
            </p>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 2 · Advisory AI Structuring</span>
            <h3 className="text-base font-semibold text-ink mt-1">PII-Sanitized Gemini Classification</h3>
            <p className="text-sm text-muted mt-1">
              Server-side Gemini 2.5 Flash analyzes sanitized text to suggest departmental category, summary, severity indicator, and hazard flags under strict schema constraints.
            </p>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 3 · Deterministic Priority Receipt</span>
            <h3 className="text-base font-semibold text-ink mt-1">Itemized 0–100 Priority Engine</h3>
            <p className="text-sm text-muted mt-1">
              Code—not the AI—calculates an itemized 0–100 urgency score across 7 weighted civic dimensions, generating a verifiable Priority Receipt visible to citizens and officials alike.
            </p>
          </div>

          <div className="rounded-md border border-border bg-surface p-4">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 4 · Human-in-the-Loop Redressal</span>
            <h3 className="text-base font-semibold text-ink mt-1">Authority Operations &amp; Verification</h3>
            <p className="text-sm text-muted mt-1">
              Ward engineers triage prioritized queues, dispatch maintenance crews, and attach photographic proof of resolution. Citizens confirm fixes to close the feedback loop.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Priority Formula */}
      <section id="priority-formula" className="scroll-mt-24 mb-14">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Icon icon={Receipt} size={20} className="text-primary" />
          3. Priority Calculation &amp; Priority Receipt
        </h2>
        <p className="text-sm md:text-base text-muted leading-relaxed mb-4">
          A fundamental architectural principle of CivicPulse AI is that <strong>AI does not decide priority</strong>. LLMs can hallucinate urgency or be swayed by sensationalist phrasing. Instead, priority is computed by a pure mathematical formula evaluating 7 civic factors:
        </p>

        {/* Weights Table */}
        <div className="my-6 overflow-x-auto rounded-md border border-border bg-surface">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Default CivicPulse priority factor weights</caption>
            <thead className="border-b border-border bg-sunken text-xs font-semibold text-muted uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">Factor</th>
                <th scope="col" className="px-4 py-3">Key</th>
                <th scope="col" className="px-4 py-3 text-right">Default Weight</th>
                <th scope="col" className="px-4 py-3">Calculation Basis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-ink">
              <tr>
                <td className="px-4 py-2.5 font-medium">Base Severity</td>
                <td className="px-4 py-2.5 font-mono text-xs">S</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right font-bold">{(DEFAULT_WEIGHTS.S * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 text-xs text-muted">Normalized severity rating (1–5)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Safety Hazard</td>
                <td className="px-4 py-2.5 font-mono text-xs">H</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right font-bold">{(DEFAULT_WEIGHTS.H * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 text-xs text-muted">Immediate public physical danger flags</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Citizen Reports</td>
                <td className="px-4 py-2.5 font-mono text-xs">R</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right font-bold">{(DEFAULT_WEIGHTS.R * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 text-xs text-muted">Logarithmic curve on distinct reporters</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Waiting Time / SLA</td>
                <td className="px-4 py-2.5 font-mono text-xs">D</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right font-bold">{(DEFAULT_WEIGHTS.D * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 text-xs text-muted">Elapsed time relative to departmental SLA</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Affected Scale</td>
                <td className="px-4 py-2.5 font-mono text-xs">A</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right font-bold">{(DEFAULT_WEIGHTS.A * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 text-xs text-muted">Impact radius (individual, street, neighbourhood)</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Cluster Hotspot</td>
                <td className="px-4 py-2.5 font-mono text-xs">G</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right font-bold">{(DEFAULT_WEIGHTS.G * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 text-xs text-muted">Open unresolved complaints within 500 m</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium">Seasonal Factor</td>
                <td className="px-4 py-2.5 font-mono text-xs">T</td>
                <td className="px-4 py-2.5 font-mono text-xs text-right font-bold">{(DEFAULT_WEIGHTS.T * 100).toFixed(0)}%</td>
                <td className="px-4 py-2.5 text-xs text-muted">Monsoon vulnerability or seasonal calendar</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted italic mb-6">
          Showing default weights. Municipal administrators can adjust weights within strict bounds (PRD §30) without breaking auditability.
        </p>

        <h3 className="text-base font-semibold text-ink mb-3">Example Priority Receipt</h3>
        <p className="text-sm text-muted mb-4">
          Every report generates an itemized ledger card showing exactly why it received its score:
        </p>
        <div className="max-w-[420px]">
          <PriorityReceipt priority={EXAMPLE_RECEIPT} variant="example" />
        </div>
      </section>

      {/* 4. Duplicate Radar */}
      <section id="duplicate-radar" className="scroll-mt-24 mb-14">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Icon icon={MapPin} size={20} className="text-primary" />
          4. Duplicate Radar Engine
        </h2>
        <p className="text-sm md:text-base text-muted leading-relaxed mb-4">
          Duplicate reports flood city queues with repeated tickets for the same broken streetlight, water pipe, or pothole. CivicPulse deploys a hybrid candidate retrieval engine:
        </p>
        <ul className="list-disc pl-5 text-sm md:text-base text-muted space-y-2 mb-4">
          <li><strong>Spatial Candidate Filtering:</strong> Geohash proximity matching queries existing open complaints within {DUPLICATE_SETTINGS.radiusM} meters.</li>
          <li><strong>Temporal Window:</strong> Evaluates complaints submitted within the last {DUPLICATE_SETTINGS.windowDays} days.</li>
          <li><strong>Multimodal Similarity Scoring:</strong> Combines text embedding cosine distance (45%), spatial proximity (25%), category match (15%), and temporal decay (15%).</li>
        </ul>
        <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-xs md:text-sm text-ink leading-relaxed">
          <strong>Non-destructive principle:</strong> CivicPulse <em>never automatically merges</em> complaints. Duplicates require human confirmation by the reporting citizen or authority staff, guaranteeing no legitimate independent hazard is lost.
        </div>
      </section>

      {/* 5. AI Methodology */}
      <section id="ai-methodology" className="scroll-mt-24 mb-14">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Icon icon={Cpu} size={20} className="text-primary" />
          5. How We Use AI (Advisory Gemini Pipeline)
        </h2>
        <p className="text-sm md:text-base text-muted leading-relaxed mb-4">
          CivicPulse uses Google Gemini models strictly as an <strong>advisory structuring assistant</strong>:
        </p>
        <ul className="list-disc pl-5 text-sm md:text-base text-muted space-y-2 mb-4">
          <li><strong>Primary Model:</strong> <code>gemini-2.5-flash</code> with structured JSON schema output for rapid categorization, summarization, and hazard flag detection.</li>
          <li><strong>Fallback Architecture:</strong> <code>gemini-2.5-flash-lite</code> activates automatically on rate limits or connectivity disruptions. If all AI calls fail, an offline heuristic regex classifier ensures zero downtime.</li>
          <li><strong>Zero Client AI Calls:</strong> All Gemini requests execute inside trusted server-side Next.js route handlers. API keys are never exposed in browser bundles.</li>
        </ul>
      </section>

      {/* 6. Privacy */}
      <section id="privacy" className="scroll-mt-24 mb-14">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Icon icon={Lock} size={20} className="text-primary" />
          6. Privacy &amp; Data Protection
        </h2>
        <p className="text-sm md:text-base text-muted leading-relaxed mb-4">
          CivicPulse is designed around Privacy by Design principles:
        </p>
        <ul className="list-disc pl-5 text-sm md:text-base text-muted space-y-2 mb-4">
          <li><strong>PII Redaction:</strong> Phone numbers (Indian 10-digit formats), email addresses, Aadhaar numbers, PAN cards, and street door numbers are scrubbed by server regex routines prior to any LLM analysis.</li>
          <li><strong>Public Projection Separation:</strong> Public explore feeds and maps read exclusively from a dedicated <code>publicComplaints</code> projection collection containing zero citizen identities, phone numbers, or private user IDs.</li>
          <li><strong>Write Isolation:</strong> Web browsers never write directly to Firestore. All state transitions enforce session cookie authentication and role verification.</li>
        </ul>
      </section>

      {/* 7. Data Sources */}
      <section id="data-sources" className="scroll-mt-24 mb-14">
        <h2 className="text-xl font-bold text-ink mb-4 flex items-center gap-2">
          <Icon icon={Database} size={20} className="text-primary" />
          7. Data Sources &amp; Licences
        </h2>
        <p className="text-sm md:text-base text-muted leading-relaxed mb-4">
          CivicPulse AI calibrates its demonstration data and spatial boundaries on established open-data standards:
        </p>
        <div className="flex flex-col gap-3 my-4">
          <div className="rounded-md border border-border bg-surface p-3.5 text-xs">
            <span className="font-semibold text-ink">Bengaluru Ward Boundaries</span> — Open DataMeet Bengaluru Wards GeoJSON (Licensed under Creative Commons Attribution 4.0 International).
          </div>
          <div className="rounded-md border border-border bg-surface p-3.5 text-xs">
            <span className="font-semibold text-ink">Basemap Tiles &amp; Vector Data</span> — OpenFreeMap vector basemaps powered by OpenStreetMap contributors (ODbL).
          </div>
          <div className="rounded-md border border-border bg-surface p-3.5 text-xs">
            <span className="font-semibold text-ink">Municipal Grievance Baseline</span> — OpenCity.in analysis of BBMP Grievance Redressal statistics (2025 public report).
          </div>
          <div className="rounded-md border border-border bg-surface p-3.5 text-xs">
            <span className="font-semibold text-ink">Demonstration Data</span> — 240 synthetic complaints generated for testing purposes, clearly marked across all views with the &ldquo;Demo data&rdquo; badge.
          </div>
        </div>
      </section>

      {/* 8. Disclaimer */}
      <section id="disclaimer" className="scroll-mt-24 rounded-lg border border-border bg-sunken p-6 mb-10">
        <div className="flex items-center gap-2 text-warning font-semibold text-sm">
          <Icon icon={ShieldCheck} size={18} />
          8. Independent Prototype Disclaimer
        </div>
        <p className="mt-2 text-xs md:text-sm text-muted leading-relaxed">
          CivicPulse AI is an <strong>independent civic-tech prototype</strong> created for the
          Innovate Applied AI Hackathon 2026. It is <strong>not affiliated with, endorsed by, or operated on behalf of</strong> the Bruhat Bengaluru Mahanagara Palike (BBMP), the Government of Karnataka, or any municipal government body.
        </p>
        <p className="mt-2 text-xs text-muted">
          All emergency incidents involving immediate life threat, fire, gas leaks, or crime should be reported immediately through official emergency numbers (112 / 101 / 108).
        </p>
      </section>

      {/* Footer Call to Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-8">
        <div className="text-xs text-muted">
          Ready to experience transparent civic triage?
        </div>
        <div className="flex items-center gap-3">
          <Link href="/explore">
            <Button variant="outline" size="sm">
              Explore Public Reports
            </Button>
          </Link>
          <Link href="/citizen/complaints/new">
            <Button size="sm" className="gap-1.5">
              Report an Issue
              <Icon icon={ArrowRight} size={14} />
            </Button>
          </Link>
        </div>
      </div>
    </ReadingLayout>
  );
}
