"use client";

import { cn } from "@/lib/cn";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  delay?: number;
}

export function BorderBeam({
  className,
  size = 200,
  duration = 6,
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        className,
      )}
      style={{
        WebkitMask:
          "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        padding: "1px",
      }}
    >
      <div
        className="border-beam-glow absolute"
        style={
          {
            "--beam-size": `${size}px`,
            "--beam-duration": `${duration}s`,
            "--beam-delay": `${delay}s`,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
