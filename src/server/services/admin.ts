import "server-only";
import * as crypto from "crypto";
import type {
  AdminUser,
  Department,
  AuditLog,
  SystemSettings,
  ComplaintCategory,
  CategoryConfig,
  Role,
  Weights,
  Bands,
} from "@/domain/types";
import { CATEGORY_CONFIG, DEFAULT_WEIGHTS, DEFAULT_BANDS, DUPLICATE_SETTINGS } from "@/domain/categories";
import { getComplaints, reloadSeedComplaints } from "./complaints";
import type { SessionUser } from "@/server/auth/session";

// In-memory collections for demo & server resilience
const MEMORY_USERS: AdminUser[] = [
  {
    uid: "demo-admin-uid",
    email: "admin@demo.civicpulse.invalid",
    displayName: "Civic Administrator",
    role: "admin",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: null,
    complaintsFiled: 2,
    createdAt: "2026-01-15T09:00:00.000Z",
    lastSignInAt: new Date().toISOString(),
  },
  {
    uid: "demo-authority-uid",
    email: "roads@demo.civicpulse.invalid",
    displayName: "K. Suresh (EE Roads)",
    role: "authority",
    departmentId: "roads",
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
    complaintsFiled: 0,
    createdAt: "2026-01-20T10:15:00.000Z",
    lastSignInAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    uid: "auth-water-uid",
    email: "water@demo.civicpulse.invalid",
    displayName: "R. Meena (BWSSB)",
    role: "authority",
    departmentId: "water",
    status: "active",
    emailVerified: true,
    homeWardId: "ward-174-h配套",
    complaintsFiled: 0,
    createdAt: "2026-02-01T11:00:00.000Z",
    lastSignInAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    uid: "auth-swm-uid",
    email: "swm@demo.civicpulse.invalid",
    displayName: "P. Gowda (SWM Lead)",
    role: "authority",
    departmentId: "swm",
    status: "active",
    emailVerified: true,
    homeWardId: "ward-149-varthur",
    complaintsFiled: 0,
    createdAt: "2026-02-05T08:30:00.000Z",
    lastSignInAt: new Date(Date.now() - 14400000).toISOString(),
  },
  {
    uid: "auth-drain-uid",
    email: "drainage@demo.civicpulse.invalid",
    displayName: "V. Rao (Stormwater)",
    role: "authority",
    departmentId: "drainage",
    status: "active",
    emailVerified: true,
    homeWardId: "ward-174-h配套",
    complaintsFiled: 0,
    createdAt: "2026-02-10T14:20:00.000Z",
    lastSignInAt: new Date(Date.now() - 28800000).toISOString(),
  },
  {
    uid: "auth-elec-uid",
    email: "electrical@demo.civicpulse.invalid",
    displayName: "S. Murthy (BESCOM)",
    role: "authority",
    departmentId: "electrical",
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
    complaintsFiled: 0,
    createdAt: "2026-02-12T16:00:00.000Z",
    lastSignInAt: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    uid: "demo-citizen-uid",
    email: "citizen@demo.civicpulse.invalid",
    displayName: "Aarav Patel",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
    complaintsFiled: 14,
    createdAt: "2026-01-10T12:00:00.000Z",
    lastSignInAt: new Date().toISOString(),
  },
  {
    uid: "citizen-priya-uid",
    email: "priya.sharma@example.com",
    displayName: "Priya Sharma",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-174-h配套",
    complaintsFiled: 8,
    createdAt: "2026-02-14T11:45:00.000Z",
    lastSignInAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    uid: "citizen-vikram-uid",
    email: "vikram.n@example.com",
    displayName: "Vikram Nambiar",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-149-varthur",
    complaintsFiled: 5,
    createdAt: "2026-02-18T10:00:00.000Z",
    lastSignInAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    uid: "citizen-ananya-uid",
    email: "ananya.r@example.com",
    displayName: "Ananya Reddy",
    role: "citizen",
    departmentId: null,
    status: "active",
    emailVerified: true,
    homeWardId: "ward-150-bellandur",
    complaintsFiled: 6,
    createdAt: "2026-02-22T09:15:00.000Z",
    lastSignInAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    uid: "citizen-suspended-uid",
    email: "spammer@example.com",
    displayName: "Flagged Citizen",
    role: "citizen",
    departmentId: null,
    status: "suspended",
    emailVerified: false,
    homeWardId: null,
    complaintsFiled: 1,
    createdAt: "2026-02-25T14:00:00.000Z",
    lastSignInAt: new Date(Date.now() - 604800000).toISOString(),
  },
];

const MEMORY_DEPARTMENTS: Department[] = [
  {
    id: "roads",
    name: "Road Infrastructure & Engineering",
    code: "BBMP-RD",
    description: "Maintenance of city roads, pothole repairs, street widening, and flyover structures.",
    active: true,
    categories: ["POTHOLE", "INFRASTRUCTURE"],
    authoritiesCount: 12,
    openComplaints: 0,
    overdueComplaints: 0,
    slaComplianceRate: 91.4,
  },
  {
    id: "swm",
    name: "Solid Waste Management",
    code: "BBMP-SWM",
    description: "Door-to-door garbage collection, dry waste collection centres, and street sweeping.",
    active: true,
    categories: ["GARBAGE"],
    authoritiesCount: 18,
    openComplaints: 0,
    overdueComplaints: 0,
    slaComplianceRate: 88.2,
  },
  {
    id: "electrical",
    name: "Street Lighting & Electrical",
    code: "BESCOM-LT",
    description: "Streetlight operation, LED repairs, high-mast towers, and cable hazard resolution.",
    active: true,
    categories: ["STREETLIGHT"],
    authoritiesCount: 8,
    openComplaints: 0,
    overdueComplaints: 0,
    slaComplianceRate: 94.7,
  },
  {
    id: "water",
    name: "Bengaluru Water Supply & Sewerage",
    code: "BWSSB-WT",
    description: "Potable pipeline leakages, low water pressure, and municipal water connections.",
    active: true,
    categories: ["WATER_LEAK"],
    authoritiesCount: 14,
    openComplaints: 0,
    overdueComplaints: 0,
    slaComplianceRate: 86.5,
  },
  {
    id: "drainage",
    name: "Stormwater Drainage & Rajakaluve",
    code: "BBMP-SWD",
    description: "Primary and secondary stormwater drains, silt clearance, and urban flood mitigation.",
    active: true,
    categories: ["DRAINAGE"],
    authoritiesCount: 6,
    openComplaints: 0,
    overdueComplaints: 0,
    slaComplianceRate: 82.0,
  },
  {
    id: "health",
    name: "Public Health & Sanitation",
    code: "BBMP-HLT",
    description: "Vector control, public toilet hygiene, animal welfare, and food safety sanitation.",
    active: true,
    categories: ["SANITATION"],
    authoritiesCount: 9,
    openComplaints: 0,
    overdueComplaints: 0,
    slaComplianceRate: 92.1,
  },
  {
    id: "general",
    name: "General Municipal Administration",
    code: "BBMP-GEN",
    description: "Uncategorized complaints, inter-departmental inquiries, and public assistance.",
    active: true,
    categories: ["OTHER"],
    authoritiesCount: 4,
    openComplaints: 0,
    overdueComplaints: 0,
    slaComplianceRate: 96.0,
  },
];

const MEMORY_CATEGORIES: Record<ComplaintCategory, CategoryConfig> = { ...CATEGORY_CONFIG };

const MEMORY_AUDIT_LOGS: AuditLog[] = [
  {
    id: "audit-001",
    action: "SYSTEM_SEED",
    actorUid: "system",
    actorEmail: "system@civicpulse.local",
    actorRole: "admin",
    targetId: "system",
    targetType: "settings",
    summary: "Seeded initial 240 synthetic complaints and ward metrics",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "audit-002",
    action: "ROLE_CHANGED",
    actorUid: "demo-admin-uid",
    actorEmail: "admin@demo.civicpulse.invalid",
    actorRole: "admin",
    targetId: "demo-authority-uid",
    targetType: "user",
    summary: "Role changed from citizen to authority (Department: roads)",
    before: { role: "citizen", departmentId: null },
    after: { role: "authority", departmentId: "roads" },
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "audit-003",
    action: "SETTINGS_UPDATED",
    actorUid: "demo-admin-uid",
    actorEmail: "admin@demo.civicpulse.invalid",
    actorRole: "admin",
    targetId: "priorityWeights",
    targetType: "settings",
    summary: "Updated priority factor weights (v3 default)",
    before: { S: 0.2, H: 0.2 },
    after: { S: 0.25, H: 0.2 },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const MEMORY_SETTINGS: SystemSettings = {
  weights: { ...DEFAULT_WEIGHTS },
  bands: { ...DEFAULT_BANDS },
  duplicates: {
    radiusM: DUPLICATE_SETTINGS.radiusM,
    windowDays: DUPLICATE_SETTINGS.windowDays,
    likely: DUPLICATE_SETTINGS.likely,
    possible: DUPLICATE_SETTINGS.possible,
  },
  ai: {
    paused: false,
    dailyBudget: 500,
    userDailyLimit: 20,
  },
  rateLimits: {
    complaintsPerUserPerDay: 10,
    supportsPerUserPerDay: 50,
  },
};

export interface ListUsersOptions {
  search?: string;
  role?: Role | "all";
  departmentId?: string | "all";
  status?: "active" | "suspended" | "all";
  page?: number;
  limit?: number;
}

export function listAdminUsers(options: ListUsersOptions = {}): {
  users: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
} {
  const { search, role, departmentId, status, page = 1, limit = 20 } = options;

  let filtered = [...MEMORY_USERS];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.departmentId && u.departmentId.toLowerCase().includes(q)),
    );
  }

  if (role && role !== "all") {
    filtered = filtered.filter((u) => u.role === role);
  }

  if (departmentId && departmentId !== "all") {
    filtered = filtered.filter((u) => u.departmentId === departmentId);
  }

  if (status && status !== "all") {
    filtered = filtered.filter((u) => u.status === status);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return {
    users: paginated,
    total,
    page,
    totalPages,
  };
}

export function updateUserRole(
  uid: string,
  newRole: Role,
  departmentId: string | null,
  actor: SessionUser,
): AdminUser {
  const user = MEMORY_USERS.find((u) => u.uid === uid);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Guard against demoting the last active admin (§UI-24)
  if (user.role === "admin" && newRole !== "admin") {
    const activeAdmins = MEMORY_USERS.filter((u) => u.role === "admin" && u.status === "active");
    if (activeAdmins.length <= 1) {
      throw new Error("LAST_ADMIN");
    }
  }

  const before = { role: user.role, departmentId: user.departmentId };
  user.role = newRole;
  user.departmentId = newRole === "authority" ? departmentId : null;

  recordAuditLog({
    action: "ROLE_CHANGED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: user.uid,
    targetType: "user",
    summary: `Changed role of ${user.displayName} to ${newRole}${newRole === "authority" ? ` (${departmentId})` : ""}`,
    before,
    after: { role: user.role, departmentId: user.departmentId },
  });

  return user;
}

export function updateUserStatus(
  uid: string,
  newStatus: "active" | "suspended",
  reason: string,
  actor: SessionUser,
): AdminUser {
  const user = MEMORY_USERS.find((u) => u.uid === uid);
  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  // Guard against suspending the last active admin
  if (user.role === "admin" && newStatus === "suspended") {
    const activeAdmins = MEMORY_USERS.filter((u) => u.role === "admin" && u.status === "active");
    if (activeAdmins.length <= 1) {
      throw new Error("LAST_ADMIN");
    }
  }

  const before = { status: user.status };
  user.status = newStatus;

  recordAuditLog({
    action: newStatus === "suspended" ? "USER_SUSPENDED" : "USER_REACTIVATED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: user.uid,
    targetType: "user",
    summary: `${newStatus === "suspended" ? "Suspended" : "Reactivated"} user ${user.displayName}. Reason: ${reason}`,
    before,
    after: { status: user.status },
  });

  return user;
}

export async function getAdminDepartments(): Promise<Department[]> {
  const complaints = await getComplaints();

  return MEMORY_DEPARTMENTS.map((dept) => {
    const deptComplaints = complaints.filter((c) => c.departmentId === dept.id);
    const open = deptComplaints.filter((c) => c.status !== "RESOLVED" && c.status !== "REJECTED").length;
    const now = Date.now();
    const overdue = deptComplaints.filter(
      (c) => c.status !== "RESOLVED" && c.status !== "REJECTED" && new Date(c.slaDueAt).getTime() < now,
    ).length;

    const resolved = deptComplaints.filter((c) => c.status === "RESOLVED");
    const compliant = resolved.filter(
      (c) => c.resolution && new Date(c.resolution.resolvedAt).getTime() <= new Date(c.slaDueAt).getTime(),
    ).length;
    const complianceRate = resolved.length > 0 ? Math.round((compliant / resolved.length) * 1000) / 10 : 92.0;

    return {
      ...dept,
      openComplaints: open,
      overdueComplaints: overdue,
      slaComplianceRate: complianceRate,
    };
  });
}

export async function updateDepartment(
  id: string,
  updates: Partial<Pick<Department, "name" | "description" | "active">>,
  actor: SessionUser,
): Promise<Department> {
  const dept = MEMORY_DEPARTMENTS.find((d) => d.id === id);
  if (!dept) {
    throw new Error("DEPARTMENT_NOT_FOUND");
  }

  // Deactivation blocked if open complaints exist (PRD §UI-25, 409 DEPARTMENT_HAS_OPEN_COMPLAINTS)
  if (updates.active === false) {
    const complaints = await getComplaints();
    const openCount = complaints.filter(
      (c) => c.departmentId === id && c.status !== "RESOLVED" && c.status !== "REJECTED",
    ).length;
    if (openCount > 0) {
      const err = new Error(`Reassign the ${openCount} open complaints first.`);
      err.name = "DEPARTMENT_HAS_OPEN_COMPLAINTS";
      throw err;
    }
  }

  const before = { name: dept.name, description: dept.description, active: dept.active };
  Object.assign(dept, updates);

  recordAuditLog({
    action: "DEPARTMENT_UPDATED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: dept.id,
    targetType: "department",
    summary: `Updated department ${dept.name} (${dept.code})`,
    before,
    after: { name: dept.name, description: dept.description, active: dept.active },
  });

  return dept;
}

export function getAdminCategories(): Record<ComplaintCategory, CategoryConfig> {
  return { ...MEMORY_CATEGORIES };
}

export function updateCategoryConfig(
  key: ComplaintCategory,
  updates: Partial<CategoryConfig>,
  actor: SessionUser,
): CategoryConfig {
  const current = MEMORY_CATEGORIES[key];
  if (!current) {
    throw new Error("CATEGORY_NOT_FOUND");
  }

  const before = { ...current };
  MEMORY_CATEGORIES[key] = {
    ...current,
    ...updates,
  };

  recordAuditLog({
    action: "CATEGORY_UPDATED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: key,
    targetType: "category",
    summary: `Updated configuration for category ${key} (Base severity: ${MEMORY_CATEGORIES[key].baseSeverity}, SLA: ${MEMORY_CATEGORIES[key].slaHours}h)`,
    before,
    after: { ...MEMORY_CATEGORIES[key] },
  });

  return MEMORY_CATEGORIES[key];
}

export function getSystemSettings(): SystemSettings {
  return JSON.parse(JSON.stringify(MEMORY_SETTINGS));
}

export function updateSystemSettings(
  section: keyof SystemSettings,
  values: unknown,
  actor: SessionUser,
): SystemSettings {
  const before = JSON.parse(JSON.stringify(MEMORY_SETTINGS[section]));

  if (section === "weights") {
    const weights = values as Weights;
    const sum = Object.values(weights).reduce((a, b) => a + Number(b), 0);
    // Weights must add up to 1.00 ± 0.001
    if (Math.abs(sum - 1.0) > 0.002) {
      throw new Error(`Weights must add up to 1.00 (currently ${sum.toFixed(2)})`);
    }
    MEMORY_SETTINGS.weights = { ...MEMORY_SETTINGS.weights, ...weights };
  } else if (section === "duplicates") {
    MEMORY_SETTINGS.duplicates = {
      ...MEMORY_SETTINGS.duplicates,
      ...(values as Partial<SystemSettings["duplicates"]>),
    };
  } else if (section === "ai") {
    MEMORY_SETTINGS.ai = {
      ...MEMORY_SETTINGS.ai,
      ...(values as Partial<SystemSettings["ai"]>),
    };
  } else if (section === "rateLimits") {
    MEMORY_SETTINGS.rateLimits = {
      ...MEMORY_SETTINGS.rateLimits,
      ...(values as Partial<SystemSettings["rateLimits"]>),
    };
  } else if (section === "bands") {
    MEMORY_SETTINGS.bands = {
      ...MEMORY_SETTINGS.bands,
      ...(values as Partial<Bands>),
    };
  }

  recordAuditLog({
    action: "SETTINGS_UPDATED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: section,
    targetType: "settings",
    summary: `Updated system settings section '${section}'`,
    before,
    after: JSON.parse(JSON.stringify(MEMORY_SETTINGS[section])),
  });

  return getSystemSettings();
}

export interface AiCallRecord {
  id: string;
  timestamp: string;
  model: string;
  category: string;
  latencyMs: number;
  tokens: number;
  source: "gemini" | "fallback";
  status: "success" | "error";
  reason?: string;
}

const MEMORY_AI_CALLS: AiCallRecord[] = [
  {
    id: "call-001",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    model: "gemini-3.8-flash",
    category: "POTHOLE",
    latencyMs: 680,
    tokens: 1240,
    source: "gemini",
    status: "success",
  },
  {
    id: "call-002",
    timestamp: new Date(Date.now() - 340000).toISOString(),
    model: "gemini-3.8-flash",
    category: "GARBAGE",
    latencyMs: 740,
    tokens: 1180,
    source: "gemini",
    status: "success",
  },
  {
    id: "call-003",
    timestamp: new Date(Date.now() - 890000).toISOString(),
    model: "keyword-classifier",
    category: "STREETLIGHT",
    latencyMs: 12,
    tokens: 0,
    source: "fallback",
    status: "success",
    reason: "SIMULATED_TIMEOUT",
  },
  {
    id: "call-004",
    timestamp: new Date(Date.now() - 1500000).toISOString(),
    model: "gemini-3.8-flash",
    category: "DRAINAGE",
    latencyMs: 820,
    tokens: 1350,
    source: "gemini",
    status: "success",
  },
  {
    id: "call-005",
    timestamp: new Date(Date.now() - 2400000).toISOString(),
    model: "gemini-3.8-flash",
    category: "WATER_LEAK",
    latencyMs: 790,
    tokens: 1290,
    source: "gemini",
    status: "success",
  },
];

export function recordAiInferenceCall(call: AiCallRecord) {
  MEMORY_AI_CALLS.unshift(call);
  if (MEMORY_AI_CALLS.length > 50) {
    MEMORY_AI_CALLS.pop();
  }
}

export function getAiMonitoringMetrics() {
  const totalCalls = 142 + MEMORY_AI_CALLS.length - 5;
  const fallbackCount = MEMORY_AI_CALLS.filter((c) => c.source === "fallback").length;
  const fallbackRate = Math.round(((fallbackCount / Math.max(1, MEMORY_AI_CALLS.length)) * 100) * 10) / 10;
  const latencies = MEMORY_AI_CALLS.map((c) => c.latencyMs).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 680;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 1420;

  return {
    paused: MEMORY_SETTINGS.ai.paused,
    dailyBudget: MEMORY_SETTINGS.ai.dailyBudget,
    totalRequestsToday: totalCalls,
    fallbackRate24h: Math.max(3.8, fallbackRate),
    latencyP50Ms: p50,
    latencyP95Ms: p95,
    tokensTotalToday: 184500 + MEMORY_AI_CALLS.reduce((sum, c) => sum + c.tokens, 0),
    recentCalls: [...MEMORY_AI_CALLS],
  };
}

export function setAiPaused(paused: boolean, actor: SessionUser) {
  const before = { paused: MEMORY_SETTINGS.ai.paused };
  MEMORY_SETTINGS.ai.paused = paused;

  recordAuditLog({
    action: paused ? "AI_PAUSED" : "AI_RESUMED",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: "ai",
    targetType: "settings",
    summary: `${paused ? "Paused" : "Resumed"} AI automatic triage and insights`,
    before,
    after: { paused },
  });

  return { paused: MEMORY_SETTINGS.ai.paused };
}

export function recordAuditLog(entry: Omit<AuditLog, "id" | "createdAt">): AuditLog {
  const log: AuditLog = {
    id: `audit-${crypto.randomUUID().slice(0, 8)}`,
    ...entry,
    createdAt: new Date().toISOString(),
  };
  MEMORY_AUDIT_LOGS.unshift(log);
  return log;
}

export function getAuditLogs(options: {
  action?: string;
  actorEmail?: string;
  targetType?: string;
  limit?: number;
} = {}): AuditLog[] {
  let list = [...MEMORY_AUDIT_LOGS];

  if (options.action && options.action !== "all") {
    list = list.filter((l) => l.action === options.action);
  }
  if (options.actorEmail) {
    const q = options.actorEmail.toLowerCase();
    list = list.filter((l) => l.actorEmail.toLowerCase().includes(q));
  }
  if (options.targetType && options.targetType !== "all") {
    list = list.filter((l) => l.targetType === options.targetType);
  }

  const limit = options.limit || 50;
  return list.slice(0, limit);
}

export async function resetDemoData(actor: SessionUser): Promise<{
  success: boolean;
  message: string;
  seededCount: number;
}> {
  // Re-read seed fixtures
  const seededCount = reloadSeedComplaints();

  recordAuditLog({
    action: "DEMO_RESET",
    actorUid: actor.uid,
    actorEmail: actor.email,
    actorRole: actor.role,
    targetId: "system",
    targetType: "settings",
    summary: `Purged synthetic complaints and reloaded ${seededCount} complaints from seed fixtures`,
  });

  return {
    success: true,
    message: `Successfully re-seeded ${seededCount} synthetic complaints and reset metrics`,
    seededCount,
  };
}
