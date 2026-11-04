/**
 * Pure domain definitions for municipal departments (§25.1, §29.3).
 * Zero server or framework imports.
 */

export interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
  description: string;
}

export const DEPARTMENTS: Record<string, DepartmentInfo> = {
  roads: {
    id: "roads",
    name: "Road Infrastructure & Engineering",
    code: "BBMP-RD",
    description: "Maintenance of city roads, pothole repairs, street widening, and flyovers.",
  },
  swm: {
    id: "swm",
    name: "Solid Waste Management",
    code: "BBMP-SWM",
    description: "Garbage collection, dry waste collection centres, and street sweeping.",
  },
  electrical: {
    id: "electrical",
    name: "Street Lighting & Electrical",
    code: "BESCOM-LT",
    description: "Streetlight operation, LED repairs, high-mast towers, and electrical safety.",
  },
  water: {
    id: "water",
    name: "Bengaluru Water Supply & Sewerage",
    code: "BWSSB-WT",
    description: "Potable pipeline leakages, low water pressure, and municipal water connections.",
  },
  drainage: {
    id: "drainage",
    name: "Stormwater Drainage & Rajakaluve",
    code: "BBMP-SWD",
    description: "Primary and secondary stormwater drains, silt clearance, and urban flood mitigation.",
  },
  health: {
    id: "health",
    name: "Public Health & Sanitation",
    code: "BBMP-HLT",
    description: "Vector control, public toilet hygiene, animal welfare, and food safety.",
  },
  general: {
    id: "general",
    name: "General Grievances",
    code: "BBMP-GEN",
    description: "Cross-departmental grievances, public safety, and general civic inquiries.",
  },
};

export function getDepartmentName(departmentId?: string | null): string {
  if (!departmentId) return "Municipal Administration";
  return DEPARTMENTS[departmentId.toLowerCase()]?.name || departmentId.toUpperCase();
}

export function getDepartmentCode(departmentId?: string | null): string {
  if (!departmentId) return "BBMP";
  return DEPARTMENTS[departmentId.toLowerCase()]?.code || departmentId.toUpperCase();
}
