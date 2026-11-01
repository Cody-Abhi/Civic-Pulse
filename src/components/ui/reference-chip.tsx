import { cn } from "@/lib/cn";

interface ReferenceChipProps {
  ref: string;
  className?: string;
}

export function ReferenceChip({ ref: refCode, className }: ReferenceChipProps) {
  return (
    <code
      className={cn(
        "inline-block rounded-xs bg-sunken px-2 py-0.5 font-mono text-[13px] tracking-[0.02em] text-ink tabular-nums",
        className,
      )}
    >
      {refCode}
    </code>
  );
}
