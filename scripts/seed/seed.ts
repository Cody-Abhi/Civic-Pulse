import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables before initializing Firebase
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const isProd =
  process.env.NODE_ENV === "production" ||
  process.argv.includes("--prod") ||
  Boolean(
    process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
      !process.env.FIRESTORE_EMULATOR_HOST &&
      process.env.NEXT_PUBLIC_USE_EMULATORS !== "true",
  );

if (!isProd) {
  if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
  }
  if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  }
}

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { parsePrivateKey } from "../../src/lib/env-schema";
import { computePriority } from "../../src/domain/priority";
import {
  CATEGORY_CONFIG,
  DEFAULT_WEIGHTS,
  DEFAULT_BANDS,
  DEFAULT_WEIGHTS_VERSION,
  DUPLICATE_SETTINGS,
} from "../../src/domain/categories";
import type {
  Complaint,
  PublicComplaint,
  ComplaintActivity,
  ComplaintCategory,
  ComplaintStatus,
  HazardFlag,
  AffectedScale,
  DurationBucket,
  User,
  Department,
} from "../../src/domain/types";
import type { MapSnapshotPoint } from "../../src/server/repositories/complaints.repo";

let app: App;
if (getApps().length === 0) {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || "civic-pulse-4a203";
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

  if (clientEmail && privateKey) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    app = initializeApp({
      projectId,
    });
  }
} else {
  app = getApps()[0]!;
}

const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);

const TOTAL_COMPLAINTS = 240;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "CivicPulseDemo2026!";
const DEMO_ADMIN_PASSWORD =
  process.env.DEMO_ADMIN_PASSWORD || process.env.DEMO_PASSWORD || "CivicPulseDemo2026!";

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

const SEED_USERS = [
  {
    uid: "demo-admin-uid",
    email: "admin@demo.civicpulse.invalid",
    displayName: "Civic Administrator",
    role: "admin" as const,
    departmentId: null,
    homeWardId: null,
    viewOnly: false,
  },
  {
    uid: "demo-admin-viewonly-uid",
    email: "admin.demo@civicpulse.invalid",
    displayName: "Admin Demo (View-Only)",
    role: "admin" as const,
    departmentId: null,
    homeWardId: null,
    viewOnly: true,
  },
  {
    uid: "demo-authority-uid",
    email: "roads@demo.civicpulse.invalid",
    displayName: "K. Suresh (EE Roads)",
    role: "authority" as const,
    departmentId: "roads",
    homeWardId: "ward-150-bellandur",
  },
  {
    uid: "auth-water-uid",
    email: "water@demo.civicpulse.invalid",
    displayName: "R. Meena (BWSSB)",
    role: "authority" as const,
    departmentId: "water",
    homeWardId: "ward-174-hsr-layout",
  },
  {
    uid: "auth-swm-uid",
    email: "swm@demo.civicpulse.invalid",
    displayName: "P. Gowda (SWM Lead)",
    role: "authority" as const,
    departmentId: "swm",
    homeWardId: "ward-151-koramangala",
  },
  {
    uid: "auth-drain-uid",
    email: "drainage@demo.civicpulse.invalid",
    displayName: "V. Rao (Stormwater)",
    role: "authority" as const,
    departmentId: "drainage",
    homeWardId: "ward-174-hsr-layout",
  },
  {
    uid: "auth-elec-uid",
    email: "electrical@demo.civicpulse.invalid",
    displayName: "S. Murthy (BESCOM)",
    role: "authority" as const,
    departmentId: "electrical",
    homeWardId: "ward-150-bellandur",
  },
  {
    uid: "demo-citizen-uid",
    email: "citizen@demo.civicpulse.invalid",
    displayName: "Aarav Patel",
    role: "citizen" as const,
    departmentId: null,
    homeWardId: "ward-150-bellandur",
  },
  {
    uid: "citizen-priya-uid",
    email: "priya.sharma@example.com",
    displayName: "Priya Sharma",
    role: "citizen" as const,
    departmentId: null,
    homeWardId: "ward-174-hsr-layout",
  },
  {
    uid: "citizen-vikram-uid",
    email: "vikram.n@example.com",
    displayName: "Vikram Nambiar",
    role: "citizen" as const,
    departmentId: null,
    homeWardId: "ward-085-whitefield",
  },
  {
    uid: "citizen-ananya-uid",
    email: "ananya.r@example.com",
    displayName: "Ananya Reddy",
    role: "citizen" as const,
    departmentId: null,
    homeWardId: "ward-150-bellandur",
  },
  {
    uid: "citizen-suspended-uid",
    email: "spammer@example.com",
    displayName: "Flagged Citizen",
    role: "citizen" as const,
    departmentId: null,
    homeWardId: null,
    status: "suspended" as const,
  },
];

const DEPARTMENTS: Department[] = [
  {
    id: "roads",
    name: "Road Infrastructure & Engineering",
    code: "BBMP-RD",
    description: "Maintenance of city roads, pothole repairs, street widening, and flyover structures.",
    active: true,
    categories: ["POTHOLE", "INFRASTRUCTURE"],
    authoritiesCount: 12,
  },
  {
    id: "swm",
    name: "Solid Waste Management",
    code: "BBMP-SWM",
    description: "Door-to-door garbage collection, dry waste collection centres, and street sweeping.",
    active: true,
    categories: ["GARBAGE"],
    authoritiesCount: 18,
  },
  {
    id: "electrical",
    name: "Street Lighting & Electrical",
    code: "BESCOM-LT",
    description: "Streetlight operation, LED repairs, high-mast towers, and cable hazard resolution.",
    active: true,
    categories: ["STREETLIGHT"],
    authoritiesCount: 8,
  },
  {
    id: "water",
    name: "Bengaluru Water Supply & Sewerage",
    code: "BWSSB-WT",
    description: "Potable pipeline leakages, low water pressure, and municipal water connections.",
    active: true,
    categories: ["WATER_LEAK"],
    authoritiesCount: 14,
  },
  {
    id: "drainage",
    name: "Stormwater Drainage & Rajakaluve",
    code: "BBMP-SWD",
    description: "Primary and secondary stormwater drains, silt clearance, and urban flood mitigation.",
    active: true,
    categories: ["DRAINAGE"],
    authoritiesCount: 6,
  },
  {
    id: "health",
    name: "Public Health & Sanitation",
    code: "BBMP-HLT",
    description: "Vector control, public toilet hygiene, animal welfare, and food safety sanitation.",
    active: true,
    categories: ["SANITATION"],
    authoritiesCount: 9,
  },
  {
    id: "general",
    name: "General Municipal Administration",
    code: "BBMP-GEN",
    description: "Uncategorized complaints, inter-departmental inquiries, and public assistance.",
    active: true,
    categories: ["OTHER"],
    authoritiesCount: 4,
  },
];

export function generateSyntheticComplaints(): Complaint[] {
  const complaints: Complaint[] = [];
  const now = Date.now();

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

    const daysAgo = (i * 59) / TOTAL_COMPLAINTS;
    const createdAtMs = now - Math.round(daysAgo * 24 * 3600 * 1000);
    const createdAtIso = new Date(createdAtMs).toISOString();

    const latJitter = ((i % 17) - 8) * 0.0012;
    const lngJitter = (((i * 7) % 19) - 9) * 0.0012;
    const lat = Number((ward.lat + latJitter).toFixed(5));
    const lng = Number((ward.lng + lngJitter).toFixed(5));

    const templates = TEMPLATES[category];
    const template = templates[i % templates.length]!;
    const description = template.replace("{landmark}", landmark);
    const title = `${category.replace(/_/g, " ")} near ${ward.name} ${landmark}`;

    const hazardFlags: HazardFlag[] = [];
    if (i % 7 === 0) hazardFlags.push("INJURY_RISK");
    if (category === "STREETLIGHT" && i % 5 === 0) hazardFlags.push("EXPOSED_WIRE");
    if (category === "POTHOLE" && i % 6 === 0) hazardFlags.push("ROAD_BLOCKED");
    if (category === "DRAINAGE" && i % 4 === 0) hazardFlags.push("SEWAGE_CONTAMINATION");

    const affectedScale: AffectedScale = i % 4 === 0 ? 0.7 : i % 3 === 0 ? 0.4 : 0.1;
    const durationBucket: DurationBucket = daysAgo < 2 ? "TODAY" : daysAgo < 7 ? "FEW_DAYS" : daysAgo < 14 ? "WEEK" : "OVER_TWO_WEEKS";
    const reporterCount = (i % 5 === 0) ? 4 : (i % 3 === 0) ? 2 : 1;

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

    const complaint: Complaint = {
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
      reporterUid: i % 7 === 0 ? "demo-citizen-uid" : `synthetic-user-${(i % 25) + 1}`,
      reporterDisplayName: i % 7 === 0 ? "Aarav Patel" : `Citizen ${(i % 25) + 1}`,
      supporterUids: [],
      supporterCount: reporterCount - 1,
      followerUids: [i % 7 === 0 ? "demo-citizen-uid" : `synthetic-user-${(i % 25) + 1}`],
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

export async function runSeed(): Promise<number> {
  console.log("🌱 Starting CivicPulse Firestore & Auth Seeding...");

  // 1. Seed Users in Firebase Auth & Firestore
  console.log("Creating/updating Firebase Auth users & Firestore profiles...");
  for (const u of SEED_USERS) {
    const userPassword = (u.role === "admin" && !u.viewOnly) ? DEMO_ADMIN_PASSWORD : DEMO_PASSWORD;
    try {
      try {
        await auth.getUser(u.uid);
        await auth.updateUser(u.uid, {
          email: u.email,
          password: userPassword,
          displayName: u.displayName,
          emailVerified: true,
        });
      } catch {
        await auth.createUser({
          uid: u.uid,
          email: u.email,
          password: userPassword,
          displayName: u.displayName,
          emailVerified: true,
        });
      }

      await auth.setCustomUserClaims(u.uid, {
        role: u.role,
        departmentId: u.departmentId,
        status: (u as { status?: string }).status || "active",
        viewOnly: Boolean(u.viewOnly),
        synthetic: true,
        v: Date.now(),
      });

      const userDoc: User = {
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        departmentId: u.departmentId,
        status: (u as { status?: "active" | "suspended" }).status || "active",
        homeWardId: u.homeWardId,
        emailVerified: true,
        viewOnly: Boolean(u.viewOnly),
        prefs: {
          defaultVisibility: "public",
          notify: { support: true, newInQueue: true, slaBreach: true },
          pushEnabled: false,
        },
        stats: {
          filed: u.role === "citizen" ? 14 : 0,
          resolved: u.role === "citizen" ? 9 : 0,
          voicesAdded: 6,
          supportersOnMyReports: 12,
          byStatus: {},
        },
        unreadNotifications: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firestore.collection("users").doc(u.uid).set(userDoc, { merge: true });
    } catch (err) {
      console.error(`Error configuring user ${u.email}:`, err);
    }
  }

  // 2. Seed Departments
  console.log("Seeding departments...");
  for (const dept of DEPARTMENTS) {
    await firestore.collection("departments").doc(dept.id).set(dept, { merge: true });
  }

  // 3. Seed System Settings
  console.log("Seeding system settings...");
  const nowIso = new Date().toISOString();
  await firestore.collection("systemSettings").doc("priorityWeights").set({
    version: 3,
    weights: DEFAULT_WEIGHTS,
    bands: DEFAULT_BANDS,
    updatedByUid: "demo-admin-uid",
    updatedAt: nowIso,
  });

  await firestore.collection("systemSettings").doc("categories").set({
    items: CATEGORY_CONFIG,
    updatedAt: nowIso,
  });

  await firestore.collection("systemSettings").doc("duplicate").set({
    ...DUPLICATE_SETTINGS,
    weights: { text: 0.45, geo: 0.25, category: 0.15, time: 0.15 },
    updatedAt: nowIso,
  });

  await firestore.collection("systemSettings").doc("ai").set({
    paused: false,
    dailyRequestBudget: 400,
    perUserDailyAnalyses: 20,
    insightCooldownMin: 10,
    updatedAt: nowIso,
  });

  await firestore.collection("systemSettings").doc("rateLimits").set({
    complaintsPerUserPerDay: 10,
    supportsPerUserPerDay: 50,
    updatedAt: nowIso,
  });

  await firestore.collection("systemSettings").doc("health").set({
    status: "healthy",
    lastCheckedAt: nowIso,
  });

  // 4. Generate & Write 240 Synthetic Complaints
  console.log("Writing 240 synthetic complaints to Firestore...");
  const complaints = generateSyntheticComplaints();

  // Write in batches of 400
  let batch = firestore.batch();
  let opCount = 0;

  const mapPoints: MapSnapshotPoint[] = [];

  for (const c of complaints) {
    batch.set(firestore.collection("complaints").doc(c.id), c);
    opCount++;

    if (c.visibility === "public") {
      const pub: PublicComplaint = {
        id: c.id,
        ref: c.ref,
        title: c.title,
        description: c.description,
        category: c.category,
        departmentId: c.departmentId,
        departmentName: c.departmentName,
        status: c.status,
        statusChangedAt: c.statusChangedAt,
        location: c.location,
        priority: c.priority,
        supporterCount: c.supporterCount,
        independentReporterCount: c.independentReporterCount,
        createdAt: c.createdAt,
      };
      batch.set(firestore.collection("publicComplaints").doc(c.id), pub);
      opCount++;

      // Include in map snapshot if not closed/rejected
      if (c.status !== "CLOSED" && c.status !== "REJECTED") {
        mapPoints.push({
          id: c.id,
          ref: c.ref,
          lat: Number(c.location.lat.toFixed(5)),
          lng: Number(c.location.lng.toFixed(5)),
          category: c.category,
          band: c.priority.band,
          score: c.priority.score,
          status: c.status,
          supporters: c.supporterCount,
          isSynthetic: true,
          title: c.title.slice(0, 40),
        });
      }
    }

    const activity: ComplaintActivity = {
      id: `act-${c.id}`,
      complaintId: c.id,
      reporterUid: c.reporterUid,
      actorUid: c.reporterUid,
      actorName: c.reporterDisplayName,
      actorRole: "citizen",
      action: "CREATED",
      createdAt: c.createdAt,
      visibleToReporter: true,
      departmentId: c.departmentId,
    };
    batch.set(firestore.collection("complaintActivities").doc(activity.id), activity);
    opCount++;

    if (opCount >= 400) {
      await batch.commit();
      batch = firestore.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }

  // 5. Aggregate and Write City Metrics Totals
  console.log("Aggregating and writing cityMetrics & departmentMetrics...");
  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
  const inProgress = complaints.filter((c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED").length;
  const submitted = complaints.filter((c) => c.status === "SUBMITTED").length;
  const critical = complaints.filter((c) => c.priority.band === "CRITICAL").length;
  const openCount = complaints.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED").length;

  const openByBand: Record<string, number> = {};
  const openByCategory: Record<string, number> = {};
  const openByDepartment: Record<string, number> = {};
  const openByWard: Record<string, number> = {};

  complaints
    .filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED")
    .forEach((c) => {
      openByBand[c.priority.band] = (openByBand[c.priority.band] || 0) + 1;
      openByCategory[c.category] = (openByCategory[c.category] || 0) + 1;
      openByDepartment[c.departmentId] = (openByDepartment[c.departmentId] || 0) + 1;
      const wId = c.location.wardId || "ward-blr-central";
      openByWard[wId] = (openByWard[wId] || 0) + 1;
    });

  const cityMetricsTotals = {
    totalComplaints: total,
    resolvedComplaints: resolved,
    inProgressComplaints: inProgress,
    submittedComplaints: submitted,
    criticalComplaints: critical,
    resolutionRate: Number(((resolved / total) * 100).toFixed(1)),
    avgResolutionHours: 21.4,
    activeCitizens: 92,
    open: openCount,
    openByBand,
    openByDepartment,
    openByCategory,
    openByWard,
    isSynthetic: true,
    updatedAt: nowIso,
  };

  await firestore.collection("cityMetrics").doc("totals").set(cityMetricsTotals);

  // Write department metrics
  for (const dept of DEPARTMENTS) {
    const deptComplaints = complaints.filter((c) => c.departmentId === dept.id);
    const deptOpen = deptComplaints.filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED").length;
    const deptOverdue = deptComplaints.filter(
      (c) => c.status !== "RESOLVED" && c.status !== "CLOSED" && new Date(c.slaDueAt).getTime() < Date.now(),
    ).length;
    const deptBands: Record<string, number> = {};
    deptComplaints
      .filter((c) => c.status !== "RESOLVED" && c.status !== "CLOSED")
      .forEach((c) => {
        deptBands[c.priority.band] = (deptBands[c.priority.band] || 0) + 1;
      });

    await firestore.collection("departmentMetrics").doc(dept.id).set({
      open: deptOpen,
      overdue: deptOverdue,
      openByBand: deptBands,
      updatedAt: nowIso,
    });
  }

  // 6. Write Map Snapshot
  console.log(`Writing mapSnapshots/current (${mapPoints.length} points)...`);
  await firestore.collection("mapSnapshots").doc("current").set({
    points: mapPoints,
    count: mapPoints.length,
    updatedAt: nowIso,
    version: 1,
  });

  // 7. Write Counter
  await firestore.collection("counters").doc("complaintSeq-2611").set({
    value: 240,
  });

  console.log(`✅ Seeding complete: ${complaints.length} complaints written to Firestore!`);
  return complaints.length;
}

// Auto-run if executed via CLI
if (process.argv[1]?.includes("seed.ts")) {
  runSeed()
    .then((count) => {
      console.log(`Seed script exited cleanly with ${count} items.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}
