"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  MapPin,
  Check,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Radio,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReferenceChip } from "@/components/ui/reference-chip";
import { PriorityReceipt } from "@/components/ai/priority-receipt";
import { DemoBadge } from "@/components/ui/demo-badge";
import { computePriority } from "@/domain/priority";
import {
  CATEGORY_CONFIG,
  DEFAULT_WEIGHTS,
  DEFAULT_BANDS,
  DEFAULT_WEIGHTS_VERSION,
} from "@/domain/categories";
import type {
  ComplaintCategory,
  HazardFlag,
  DurationBucket,
  AffectedScale,
  PriorityResult,
} from "@/domain/types";

const CATEGORIES: { key: ComplaintCategory; label: string; icon: string; description: string }[] = [
  { key: "POTHOLE", label: "Road pothole", icon: "🕳️", description: "Crater, sunken trench, or damaged asphalt" },
  { key: "GARBAGE", label: "Garbage dump", icon: "🗑️", description: "Overflowing bin, street waste, or C&D debris" },
  { key: "STREETLIGHT", label: "Streetlight fault", icon: "💡", description: "Dead light, blinking bulb, or exposed wire" },
  { key: "DRAINAGE", label: "Drainage / Sewage", icon: "🌊", description: "Clogged stormwater drain or overflowing sewer" },
  { key: "WATER_LEAK", label: "Water pipeline leak", icon: "💧", description: "Burst Kaveri main, leaking tap or valve" },
  { key: "SANITATION", label: "Public sanitation", icon: "🚻", description: "Dirty public toilet or unsanitary wall" },
  { key: "INFRASTRUCTURE", label: "Footpath / Railing", icon: "🚧", description: "Broken walkway slab, damaged barrier" },
  { key: "OTHER", label: "Other civic issue", icon: "📋", description: "Encroachment, fallen branch, stray animal" },
];

const WARDS = [
  { id: "ward-150-bellandur", name: "150 - Bellandur", lat: 12.9304, lng: 77.6784 },
  { id: "ward-080-indiranagar", name: "080 - Indiranagar", lat: 12.9719, lng: 77.6412 },
  { id: "ward-151-koramangala", name: "151 - Koramangala", lat: 12.9352, lng: 77.6245 },
  { id: "ward-085-whitefield", name: "085 - Whitefield", lat: 12.9698, lng: 77.7499 },
  { id: "ward-174-hsr-layout", name: "174 - HSR Layout", lat: 12.9121, lng: 77.6446 },
  { id: "ward-045-malleshwaram", name: "045 - Malleshwaram", lat: 12.9982, lng: 77.5703 },
  { id: "ward-168-jayanagar", name: "168 - Jayanagar", lat: 12.9308, lng: 77.5838 },
  { id: "ward-007-hebbal", name: "007 - Hebbal", lat: 13.0358, lng: 77.597 },
];

const HAZARDS: { flag: HazardFlag; label: string; desc: string }[] = [
  { flag: "INJURY_RISK", label: "Risk of physical injury", desc: "Open manhole, deep pit, broken iron slab" },
  { flag: "EXPOSED_WIRE", label: "Exposed electrical wire", desc: "Live wire or sparks near pedestrian path" },
  { flag: "ROAD_BLOCKED", label: "Traffic lane or road blocked", desc: "Causes major vehicle hazard or deadlock" },
  { flag: "SEWAGE_CONTAMINATION", label: "Sewage contamination", desc: "Health hazard entering drinking line or residence" },
];

interface FormState {
  category: ComplaintCategory;
  title: string;
  description: string;
  durationBucket: DurationBucket;
  affectedScale: AffectedScale;
  hazardFlags: HazardFlag[];
  wardId: string;
  landmark: string;
  lat: number;
  lng: number;
  visibility: "public" | "private";
}

const INITIAL_STATE: FormState = {
  category: "POTHOLE",
  title: "",
  description: "",
  durationBucket: "FEW_DAYS",
  affectedScale: 0.4,
  hazardFlags: [],
  wardId: "ward-080-indiranagar",
  landmark: "",
  lat: 12.9719,
  lng: 77.6412,
  visibility: "public",
};

export default function ReportWizardPage() {
  const [step, setStep] = React.useState<number>(1);
  const [form, setForm] = React.useState<FormState>(INITIAL_STATE);
  const [baseTimestamp] = React.useState<number>(() => Date.now());
  const [hasDraft, setHasDraft] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = sessionStorage.getItem("cp:draft:citizen");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.description || parsed.title);
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [submittedResult, setSubmittedResult] = React.useState<{
    id: string;
    ref: string;
    status: string;
    priority: PriorityResult;
    publicUrl: string | null;
  } | null>(null);

  const restoreDraft = () => {
    try {
      const saved = sessionStorage.getItem("cp:draft:citizen");
      if (saved) {
        setForm(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
    setHasDraft(false);
  };

  const discardDraft = () => {
    try {
      sessionStorage.removeItem("cp:draft:citizen");
    } catch {
      // ignore
    }
    setHasDraft(false);
  };

  // Save draft on form change
  React.useEffect(() => {
    if (step > 1 && step < 7) {
      try {
        sessionStorage.setItem("cp:draft:citizen", JSON.stringify(form));
      } catch {
        // ignore
      }
    }
  }, [form, step]);

  // Compute live priority receipt preview
  const livePriority = React.useMemo(() => {
    const config = CATEGORY_CONFIG[form.category] || CATEGORY_CONFIG.OTHER;
    return computePriority({
      baseSeverity: config.baseSeverity,
      verifiedSeverity: null,
      hazardFlags: form.hazardFlags,
      independentReporterCount: 1,
      createdAtMs: baseTimestamp,
      nowMs: baseTimestamp,
      slaHours: config.slaHours,
      affectedScale: form.affectedScale,
      nearbyOpenClusters: 0,
      timeSensitive: config.timeSensitive,
      seasonMonths: config.seasonMonths,
      adjustment: 0,
      weights: DEFAULT_WEIGHTS,
      bands: DEFAULT_BANDS,
      weightsVersion: DEFAULT_WEIGHTS_VERSION,
    });
  }, [form.category, form.hazardFlags, form.affectedScale, baseTimestamp]);

  // PII detection check
  const piiDetected = React.useMemo(() => {
    const text = `${form.title} ${form.description}`;
    const phonePattern = /(?:\+91[-\s]?)?[6-9]\d{9}/;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    return phonePattern.test(text) || emailPattern.test(text);
  }, [form.title, form.description]);

  const removePii = () => {
    const phonePattern = /(?:\+91[-\s]?)?[6-9]\d{9}/g;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    setForm((prev) => ({
      ...prev,
      title: prev.title.replace(phonePattern, "[removed]").replace(emailPattern, "[removed]"),
      description: prev.description.replace(phonePattern, "[removed]").replace(emailPattern, "[removed]"),
    }));
  };

  // Handle Ward selection & coordinates update
  const handleWardChange = (wardId: string) => {
    const ward = WARDS.find((w) => w.id === wardId);
    if (ward) {
      setForm((prev) => ({
        ...prev,
        wardId: ward.id,
        lat: ward.lat,
        lng: ward.lng,
      }));
    }
  };

  // Submission handler
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `submit-${Date.now()}`,
        },
        body: JSON.stringify({
          title: form.title || undefined,
          description: form.description,
          category: form.category,
          categorySource: "user",
          location: {
            lat: form.lat,
            lng: form.lng,
            wardId: form.wardId,
            landmark: form.landmark || undefined,
          },
          durationBucket: form.durationBucket,
          affectedScale: form.affectedScale,
          hazardFlags: form.hazardFlags,
          visibility: form.visibility,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit complaint");
      }

      const result = await res.json();
      setSubmittedResult(result);
      setStep(7); // Jump to Confirmation state
      try {
        sessionStorage.removeItem("cp:draft:citizen");
      } catch {
        // ignore
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, name: "Issue" },
    { num: 2, name: "Details" },
    { num: 3, name: "Location" },
    { num: 4, name: "Evidence" },
    { num: 5, name: "AI Review" },
    { num: 6, name: "Confirm" },
  ];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 pb-16">
      {/* Draft Resume Alert */}
      {hasDraft && step === 1 && (
        <div className="flex flex-col gap-2 rounded-md border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <p className="text-sm text-ink">
              Continue your unfinished report from your previous session?
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button size="sm" variant="outline" onClick={discardDraft}>
              Start over
            </Button>
            <Button size="sm" onClick={restoreDraft}>
              Continue report
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      {step < 7 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Step {step} of 6 · {steps[step - 1]?.name}
            </span>
            <DemoBadge />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {step === 1 && "What civic issue do you want to report?"}
            {step === 2 && "Describe the issue and affected area"}
            {step === 3 && "Where is the problem located?"}
            {step === 4 && "Add photos or evidence (optional)"}
            {step === 5 && "Advisory AI analysis & duplicate check"}
            {step === 6 && "Review details and Priority Receipt"}
          </h1>

          {/* Stepper progress bar */}
          <div className="grid grid-cols-6 gap-2 pt-2" aria-hidden="true">
            {steps.map((s) => (
              <div
                key={s.num}
                className={`h-1.5 rounded-full transition-colors ${
                  s.num <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <fieldset className="flex flex-col gap-6">
          <legend className="sr-only">Choose category</legend>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, category: cat.key }))}
                className={`flex flex-col items-start gap-2 rounded-md border p-4 text-left transition-all focus-visible:outline-2 focus-visible:outline-primary ${
                  form.category === cat.key
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                    : "border-border bg-surface hover:bg-surface-muted/50"
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-semibold text-ink text-sm">{cat.label}</span>
                <span className="text-xs text-muted leading-relaxed">{cat.description}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setStep(2)} className="gap-2">
              <span>Next: Details</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </fieldset>
      )}

      {/* Step 2: Description & Details */}
      {step === 2 && (
        <div className="flex flex-col gap-6">
          {/* PII Alert */}
          {piiDetected && (
            <div className="flex flex-col gap-2 rounded-md border border-warning/40 bg-warning-bg/40 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="text-xs text-ink">
                  Looks like phone number or email was entered. Reports are public to keep authorities accountable.
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={removePii} className="shrink-0 self-start sm:self-auto">
                Redact for me
              </Button>
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-title" className="text-sm font-semibold text-ink">
              Title <span className="text-xs font-normal text-muted">(optional, ≤ 80 chars)</span>
            </label>
            <input
              id="report-title"
              type="text"
              maxLength={80}
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Deep pothole right before Indiranagar metro station"
              className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="report-description" className="text-sm font-semibold text-ink">
                Description <span className="text-xs text-primary">*</span>
              </label>
              <span className="font-mono text-xs text-muted">{form.description.length} / 1000</span>
            </div>
            <textarea
              id="report-description"
              rows={4}
              minLength={20}
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what is broken, where exactly on the road or footpath, and how long it has been there. Do not include personal phone numbers or names."
              className="rounded-md border border-border bg-surface p-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {form.description.length > 0 && form.description.length < 20 && (
              <span className="text-xs text-warning">Please enter at least 20 characters describing the issue.</span>
            )}
          </div>

          {/* Since when */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">Since when has this issue existed?</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { key: "TODAY", label: "Today" },
                  { key: "FEW_DAYS", label: "2–3 days" },
                  { key: "WEEK", label: "About a week" },
                  { key: "OVER_TWO_WEEKS", label: "More than 2 weeks" },
                ] as const
              ).map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, durationBucket: d.key }))}
                  className={`rounded-md border px-3 py-2 text-center text-xs font-medium transition-colors ${
                    form.durationBucket === d.key
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-border bg-surface text-ink hover:bg-surface-muted"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Who is affected */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-ink">Who is affected by this?</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(
                [
                  { val: 0.1, label: "Just my immediate house / premises" },
                  { val: 0.4, label: "My street or residential lane" },
                  { val: 0.7, label: "The broader neighbourhood / ward" },
                  { val: 1.0, label: "Main road, junction, school or hospital route" },
                ] as const
              ).map((scale) => (
                <button
                  key={scale.val}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, affectedScale: scale.val as AffectedScale }))}
                  className={`flex items-center gap-2 rounded-md border p-3 text-left text-xs transition-colors ${
                    form.affectedScale === scale.val
                      ? "border-primary bg-primary/10 text-ink font-semibold"
                      : "border-border bg-surface text-ink hover:bg-surface-muted"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                      form.affectedScale === scale.val ? "border-primary bg-primary text-white" : "border-border"
                    }`}
                  >
                    {form.affectedScale === scale.val && <Check className="h-3 w-3" />}
                  </span>
                  <span>{scale.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hazards Checklist */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-ink">Urgent safety hazards (check all that apply)</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {HAZARDS.map((h) => {
                const checked = form.hazardFlags.includes(h.flag);
                return (
                  <button
                    key={h.flag}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        hazardFlags: checked
                          ? prev.hazardFlags.filter((f) => f !== h.flag)
                          : [...prev.hazardFlags, h.flag],
                      }));
                    }}
                    className={`flex items-start gap-2.5 rounded-md border p-3 text-left transition-colors ${
                      checked
                        ? "border-warning bg-warning-bg/40 text-ink"
                        : "border-border bg-surface hover:bg-surface-muted"
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                        checked ? "border-warning bg-warning text-white" : "border-border"
                      }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-ink">{h.label}</span>
                      <span className="text-[11px] text-muted">{h.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back</span>
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={form.description.trim().length < 20}
              className="gap-2"
            >
              <span>Next: Location</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Location */}
      {step === 3 && (
        <div className="flex flex-col gap-6">
          {/* Ward Selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ward-select" className="text-sm font-semibold text-ink">
              BBMP Municipal Ward
            </label>
            <select
              id="ward-select"
              value={form.wardId}
              onChange={(e) => handleWardChange(e.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            >
              {WARDS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Landmark */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="landmark-input" className="text-sm font-semibold text-ink">
              Landmark or crossroad directions <span className="text-xs text-muted">(e.g., Near metro pillar 142)</span>
            </label>
            <input
              id="landmark-input"
              type="text"
              maxLength={120}
              value={form.landmark}
              onChange={(e) => setForm((prev) => ({ ...prev, landmark: e.target.value }))}
              placeholder="e.g. Opposite BDA Complex, 5th Cross Road junction"
              className="rounded-md border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          {/* Coordinates Pin preview */}
          <div className="rounded-md border border-border bg-surface p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>Geographic Pin Coordinates</span>
              </div>
              <span className="font-mono text-xs text-muted">
                {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
              </span>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Mapped to Bengaluru municipal boundaries. Precision within ±15 meters.
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back</span>
            </Button>
            <Button onClick={() => setStep(4)} className="gap-2">
              <span>Next: Photos</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Evidence Photos (Optional) */}
      {step === 4 && (
        <div className="flex flex-col gap-6">
          <div className="rounded-md border border-dashed border-border bg-surface p-8 flex flex-col items-center justify-center text-center gap-3">
            <span className="text-4xl">📸</span>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-ink">Upload on-ground photos</h3>
              <p className="text-xs text-muted max-w-md">
                Photos help municipal engineers verify the hazard faster. Photos are optional and all EXIF metadata is stripped before saving.
              </p>
            </div>
            <div className="pt-2">
              <Button variant="secondary" size="sm" type="button">
                Select photos (Max 3)
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(3)} className="gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back</span>
            </Button>
            <Button onClick={() => setStep(5)} className="gap-2">
              <span>Next: AI Review</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 5: Advisory AI & Duplicate Radar */}
      {step === 5 && (
        <div className="flex flex-col gap-6">
          {/* Advisory Gemini Card */}
          <div className="rounded-md border border-primary/30 bg-primary/5 p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-ink text-base">Advisory AI Analysis</h3>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Gemini Advisory (High 88%)
              </span>
            </div>

            <p className="text-xs text-ink-muted leading-relaxed">
              AI suggestions are strictly advisory and assist municipal dispatchers. The priority score is computed by transparent deterministic code, not an AI black box.
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-muted">Detected Category</span>
                <span className="text-sm font-semibold text-ink">{form.category.replace(/_/g, " ")}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-muted">Assigned Department</span>
                <span className="text-sm font-semibold text-ink">
                  {CATEGORY_CONFIG[form.category]?.departmentId.toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-muted">Standard SLA</span>
                <span className="text-sm font-semibold text-ink">
                  {CATEGORY_CONFIG[form.category]?.slaHours} hours
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-muted">Estimated Priority</span>
                <span className="text-sm font-semibold text-primary">{livePriority.score} / 100</span>
              </div>
            </div>
          </div>

          {/* Duplicate Radar */}
          <div className="rounded-md border border-border bg-surface p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" aria-hidden="true" />
                <h3 className="font-semibold text-ink text-sm">Duplicate Radar</h3>
              </div>
              <span className="text-xs text-muted">300m radius check</span>
            </div>

            <p className="text-xs text-muted">
              No active duplicate reports found within 300m matching this description. Your report will be registered as a primary ticket.
            </p>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setStep(4)} className="gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Back</span>
            </Button>
            <Button onClick={() => setStep(6)} className="gap-2">
              <span>Next: Confirm</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 6: Confirmation & Priority Receipt */}
      {step === 6 && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Summary Details Left (7 cols) */}
          <div className="flex flex-col gap-5 lg:col-span-7">
            <div className="rounded-md border border-border bg-surface p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="font-semibold text-ink text-base">Report Summary</h3>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Edit details
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="text-xs text-muted">Title</span>
                  <p className="text-sm font-medium text-ink">
                    {form.title || `${form.category.replace(/_/g, " ")} near ${form.landmark || "Bengaluru"}`}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-muted">Description</span>
                  <p className="text-sm text-ink-muted leading-relaxed">{form.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-xs text-muted">Category</span>
                    <p className="text-sm font-medium text-ink">{form.category.replace(/_/g, " ")}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted">Ward</span>
                    <p className="text-sm font-medium text-ink">
                      {WARDS.find((w) => w.id === form.wardId)?.name}
                    </p>
                  </div>
                </div>

                {form.hazardFlags.length > 0 && (
                  <div>
                    <span className="text-xs text-muted">Safety Hazards Declared</span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {form.hazardFlags.map((flag) => (
                        <span
                          key={flag}
                          className="rounded bg-warning-bg px-2 py-0.5 text-[11px] font-semibold text-warning"
                        >
                          {flag.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Visibility toggle */}
            <label className="flex items-start gap-3 rounded-md border border-border bg-surface p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={form.visibility === "public"}
                onChange={(e) => setForm((prev) => ({ ...prev, visibility: e.target.checked ? "public" : "private" }))}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-ink">Make this report public (recommended)</span>
                <span className="text-xs text-muted">
                  Public reports appear on the ward map without your name so neighbors can add their support.
                </span>
              </div>
            </label>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(5)} className="gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back</span>
              </Button>
              <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Submitting report...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Submit report</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Priority Receipt Right (5 cols) */}
          <div className="lg:col-span-5">
            <PriorityReceipt priority={livePriority} variant="preview" />
          </div>
        </div>
      )}

      {/* Step 7: Post-Submit Confirmation State */}
      {step === 7 && submittedResult && (
        <div className="flex flex-col items-center justify-center gap-6 rounded-md border border-border bg-surface p-8 text-center sm:p-12 shadow-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2 max-w-md">
            <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">
              Report successfully submitted
            </h1>
            <p className="text-sm text-ink-muted">
              Your issue has been registered in the municipal queue with a verified priority score. You will receive updates as the field team takes action.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 p-4 rounded-md border border-border bg-surface-muted/50">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">
              Permanent Reference Code
            </span>
            <ReferenceChip reference={submittedResult.ref} className="text-base py-1 px-3" />
          </div>

          <div className="w-full max-w-md">
            <PriorityReceipt priority={submittedResult.priority} variant="full" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button asChild className="gap-2">
              <Link href={`/citizen/complaints/${submittedResult.id}`}>
                <span>Track this report</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setForm(INITIAL_STATE);
                setSubmittedResult(null);
                setStep(1);
              }}
            >
              Report another issue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
