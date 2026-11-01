/** Display formatting helpers (locale en-IN). Presentation only. */

const NUM = new Intl.NumberFormat("en-IN");

export type MetricUnit = "count" | "percent" | "hours" | "days";

export function formatNumber(value: number): string {
  return NUM.format(value);
}

export function formatMetric(value: number | null, unit?: MetricUnit): string {
  if (value === null || Number.isNaN(value)) return "—";
  switch (unit) {
    case "percent":
      return `${Math.round(value * 10) / 10}%`;
    case "hours":
      return `${Math.round(value * 10) / 10} h`;
    case "days":
      return `${Math.round(value * 10) / 10} d`;
    default:
      return NUM.format(value);
  }
}

/** Format a signed delta for a KPI (e.g. +12%, −3). */
export function formatDelta(value: number, unit?: MetricUnit): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  const abs = Math.abs(value);
  const body = unit === "percent" ? `${abs}%` : NUM.format(abs);
  return `${sign}${body}`;
}
