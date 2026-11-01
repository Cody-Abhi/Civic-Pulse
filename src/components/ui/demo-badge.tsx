import { cn } from "@/lib/cn";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-demo-bg px-2 py-0.5 text-xs font-medium text-demo-fg",
        className,
      )}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 3.5v3M6 8h.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      Demo data
    </span>
  );
}
