import { cn } from "@/lib/cn";

/** Loading placeholder; shimmer is disabled under reduced-motion (globals.css). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-sm bg-sunken", className)}
      aria-hidden
      {...props}
    />
  );
}
