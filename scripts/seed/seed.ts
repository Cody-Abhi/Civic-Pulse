import * as fs from "fs";
import * as path from "path";
import { computePriority } from "../../src/domain/priority";
import {
  CATEGORY_CONFIG,
  DEFAULT_WEIGHTS,
  DEFAULT_BANDS,
  DEFAULT_WEIGHTS_VERSION,
} from "../../src/domain/categories";
import type {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  HazardFlag,
  AffectedScale,
  DurationBucket,
} from "../../src/domain/types";

// Seed parameters (§35)
const TOTAL_COMPLAINTS = 240;

const WARDS = [
  { id: "ward-150-bellandur", name: "Bellandur", lat: 12.9304, lng: 77.6784 },
  { id: "ward-080-indiranagar", name: "Indiranagar", lat: 12.9719, lng: 77.6412 },
  { id: "ward-151-koramangala", name: "Koramangala", lat: 12.9352, lng: 77.6245 },
  { id: "ward-085-whitefield", name: "Whitefield", lat: 12.9698, lng: 77.7499 },
  { id: "ward-174-hsr-layout", name: "HSR Layout", lat: 12.9121, lng: 77.6446 },
  { id: "ward-045-malleshwaram", name: "Malleshwaram", lat: 12.9982, lng: 77.5703 },
  { id: "ward-168-jayanagar", name: "Jayanagar", lat: 12.9308, lng: 77.5838 },
  { id: "ward-007-hebbal", name: "Hebbal", lat: 13.0358, lng: 77.597 },
];

const TEMPLATES: Record<ComplaintCategory, string[]> = {
  STREETLIGHT: [
    "Streetlight pole not functioning near {landmark}, creating unsafe dark stretch at night.",
    "Blinking LED street lamp on main road opposite {landmark}.",
    "Completely dead street lights for over 300 meters near {landmark}.",
    "Damaged streetlight casing with exposed connection wires after recent wind.",
  ],
  GARBAGE: [
    "Large garbage pile overflow on corner near {landmark}, causing foul smell.",
    "Uncollected commercial waste dumped on pedestrian walkway beside {landmark}.",
    "Black spots and debris left unattended for over 4 days near {landmark}.",
    "C&D construction debris dumped blocking rainwater passage near {landmark}.",
  ],
  POTHOLE: [
    "Deep asphalt pothole right before {landmark}, causing two-wheeler skids.",
    "Multiple consecutive craters on busy junction near {landmark}.",
    "Sunken road trench cut for pipeline work left unpaved near {landmark}.",
    "Hazardous surface disintegration on bus route outside {landmark}.",
  ],
  DRAINAGE: [
    "Open stormwater drain clogged with silt and plastic bottles near {landmark}.",
    "Sewage overflow mixing into road gutter near {landmark}.",
    "Missing concrete drain cover slab posing severe pedestrian risk near {landmark}.",
    "Stagnant drain water backing up during light showers near {landmark}.",
  ],
  WATER_LEAK: [
    "High-pressure Kaveri water supply pipe leaking clean drinking water near {landmark}.",
    "Underground valve leakage creating continuous pool on road outside {landmark}.",
    "Damaged public tap leaking continuously into drain near {landmark}.",
    "Subsurface water main burst cracking the pavement near {landmark}.",
  ],
  SANITATION: [
    "Public toilet facility overflowing and unmaintained near {landmark}.",
    "Unsanitary waste accumulation along perimeter wall of {landmark}.",
    "Stagnant sewage smell due to blocked manhole near {landmark}.",
  ],
  INFRASTRUCTURE: [
    "Broken footpath paving blocks causing tripping hazard near {landmark}.",
    "Damaged roadside guard rail hanging precariously near {landmark}.",
    "Fallen branch resting on pedestrian railing near {landmark}.",
  ],
  OTHER: [
    "Encroachment on public footpath hindering senior citizens near {landmark}.",
    "Dead stray animal removal requested near {landmark}.",
    "Overgrown wild foliage blocking road visibility sign near {landmark}.",
  ],
};

const LANDMARKS = [
  "bus stop",
  "metro pillar #142",
  "government primary school",
  "temple arch",
  "crossroad signal",
  "community park entrance",
  "market complex gate",
  "junction circle",
];

export function generateSyntheticComplaints(): Complaint[] {
  const complaints: Complaint[] = [];
  const now = Date.now();

  // BBMP calibrated category distribution:
  // Streetlight ~31%, Garbage ~30%, Pothole ~15%, Drainage ~10%, Water ~8%, Sanitation ~4%, Infra ~2%
  const categoryPool: ComplaintCategory[] = [];
  const pushCat = (cat: ComplaintCategory, count: number) => {
    for (let i = 0; i < count; i++) categoryPool.push(cat);
  };
  pushCat("STREETLIGHT", 74);
  pushCat("GARBAGE", 72);
  pushCat("POTHOLE", 36);
  pushCat("DRAINAGE", 24);
  pushCat("WATER_LEAK", 18);
  pushCat("SANITATION", 8);
  pushCat("INFRASTRUCTURE", 5);
  pushCat("OTHER", 3);

  // Status distributions: ~55% CLOSED/RESOLVED, 30% IN_PROGRESS/ASSIGNED, 10% SUBMITTED, 5% REJECTED
  const statusPool: ComplaintStatus[] = [];
  const pushStatus = (st: ComplaintStatus, count: number) => {
    for (let i = 0; i < count; i++) statusPool.push(st);
  };
  pushStatus("RESOLVED", 75);
  pushStatus("CLOSED", 55);
  pushStatus("IN_PROGRESS", 45);
  pushStatus("ASSIGNED", 28);
  pushStatus("SUBMITTED", 25);
  pushStatus("REJECTED", 8);
  pushStatus("REOPENED", 4);

  for (let i = 0; i < TOTAL_COMPLAINTS; i++) {
    const category = categoryPool[i % categoryPool.length]!;
    const status = statusPool[i % statusPool.length]!;
    const ward = WARDS[i % WARDS.length]!;
    const landmark = LANDMARKS[i % LANDMARKS.length]!;
    const config = CATEGORY_CONFIG[category];

    // Timestamp spanning last 60 days
    const daysAgo = (i * 59) / TOTAL_COMPLAINTS;
    const createdAtMs = now - Math.round(daysAgo * 24 * 3600 * 1000);
    const createdAtIso = new Date(createdAtMs).toISOString();

    // Coordinates with small realistic jitter within ward (~300m)
    const latJitter = ((i % 17) - 8) * 0.0012;
    const lngJitter = (((i * 7) % 19) - 9) * 0.0012;
    const lat = Number((ward.lat + latJitter).toFixed(5));
    const lng = Number((ward.lng + lngJitter).toFixed(5));

    // Template description
    const templates = TEMPLATES[category];
    const template = templates[i % templates.length]!;
    const description = template.replace("{landmark}", landmark);
    const title = `${category.replace(/_/g, " ")} near ${ward.name} ${landmark}`;

    // Hazard flags for high urgency items
    const hazardFlags: HazardFlag[] = [];
    if (i % 7 === 0) hazardFlags.push("INJURY_RISK");
    if (category === "STREETLIGHT" && i % 5 === 0) hazardFlags.push("EXPOSED_WIRE");
    if (category === "POTHOLE" && i % 6 === 0) hazardFlags.push("ROAD_BLOCKED");
    if (category === "DRAINAGE" && i % 4 === 0) hazardFlags.push("SEWAGE_CONTAMINATION");

    const affectedScale: AffectedScale = i % 4 === 0 ? 0.7 : i % 3 === 0 ? 0.4 : 0.1;
    const durationBucket: DurationBucket = daysAgo < 2 ? "TODAY" : daysAgo < 7 ? "FEW_DAYS" : daysAgo < 14 ? "WEEK" : "OVER_TWO_WEEKS";
    const reporterCount = (i % 5 === 0) ? 4 : (i % 3 === 0) ? 2 : 1;

    // Compute priority
    const priority = computePriority({
      baseSeverity: config.baseSeverity,
      verifiedSeverity: status === "RESOLVED" || status === "CLOSED" ? config.baseSeverity : null,
      hazardFlags,
      independentReporterCount: reporterCount,
      createdAtMs,
      nowMs: now,
      slaHours: config.slaHours,
      affectedScale,
      nearbyOpenClusters: (i % 6),
      timeSensitive: config.timeSensitive,
      seasonMonths: config.seasonMonths,
      adjustment: 0,
      weights: DEFAULT_WEIGHTS,
      bands: DEFAULT_BANDS,
      weightsVersion: DEFAULT_WEIGHTS_VERSION,
    });

    const seqNum = String(i + 1).padStart(6, "0");
    const ref = `CP-BLR-2611-${seqNum}`;
    const id = `synthetic-${seqNum}`;

    const complaint: Complaint & { isSynthetic: boolean } = {
      id,
      ref,
      cityId: "blr",
      title,
      description,
      category,
      categorySource: i % 2 === 0 ? "ai" : "user",
      categoryConfirmed: true,
      aiCategory: category,
      aiConfidence: 0.85 + ((i % 10) * 0.01),
      departmentId: config.departmentId,
      departmentName: config.departmentId.toUpperCase(),
      assignedToUid: status !== "SUBMITTED" ? "demo-authority-uid" : null,
      status,
      statusChangedAt: createdAtIso,
      reopenCount: status === "REOPENED" ? 1 : 0,
      visibility: "public",
      location: {
        lat,
        lng,
        geohash: "tdr1",
        geohash5: "tdr1v",
        geohash6: "tdr1v4",
        wardId: ward.id,
        wardName: ward.name,
        landmark: `${ward.name} ${landmark}`,
      },
      durationBucket,
      affectedScale,
      hazardFlags,
      reporterUid: `synthetic-user-${(i % 25) + 1}`,
      reporterDisplayName: `Citizen ${(i % 25) + 1}`,
      supporterUids: [],
      supporterCount: reporterCount - 1,
      followerUids: [`synthetic-user-${(i % 25) + 1}`],
      independentReporterCount: reporterCount,
      clusterRootId: null,
      linkedChildIds: [],
      pendingDuplicateCount: 0,
      verifiedSeverity: null,
      priority,
      slaHours: config.slaHours,
      slaDueAt: new Date(createdAtMs + config.slaHours * 3600 * 1000).toISOString(),
      aiAnalysisId: null,
      aiStatus: "gemini",
      evidence: [],
      resolution: status === "RESOLVED" || status === "CLOSED" ? {
        note: "Issue inspected and addressed by municipal field team.",
        resolvedAt: new Date(createdAtMs + 18 * 3600 * 1000).toISOString(),
        resolvedByUid: "demo-authority-uid",
        departmentId: config.departmentId,
        evidence: [],
      } : null,
      feedback: null,
      isSynthetic: true,
      createdAt: createdAtIso,
      updatedAt: createdAtIso,
    };

    complaints.push(complaint);
  }

  return complaints;
}

export async function runSeed() {
  console.log("Generating 240 synthetic complaints...");
  const complaints = generateSyntheticComplaints();

  const fixtureDir = path.join(process.cwd(), "fixtures", "seed");
  if (!fs.existsSync(fixtureDir)) {
    fs.mkdirSync(fixtureDir, { recursive: true });
  }

  // Calculate cityMetrics totals
  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
  const inProgress = complaints.filter((c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED").length;
  const submitted = complaints.filter((c) => c.status === "SUBMITTED").length;
  const critical = complaints.filter((c) => c.priority.band === "CRITICAL").length;

  const cityMetrics = {
    totalComplaints: total,
    resolvedComplaints: resolved,
    inProgressComplaints: inProgress,
    submittedComplaints: submitted,
    criticalComplaints: critical,
    resolutionRate: Number(((resolved / total) * 100).toFixed(1)),
    avgResolutionHours: 21.4,
    activeCitizens: 92,
    isSynthetic: true,
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(fixtureDir, "complaints.json"),
    JSON.stringify(complaints, null, 2),
  );

  fs.writeFileSync(
    path.join(fixtureDir, "metrics.json"),
    JSON.stringify(cityMetrics, null, 2),
  );

  console.log(`Successfully generated ${complaints.length} synthetic complaints with isSynthetic=true!`);
  console.log("City Metrics Totals:", cityMetrics);
}

// Auto-run if executed via CLI
if (process.argv[1]?.includes("seed.ts")) {
  runSeed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}
