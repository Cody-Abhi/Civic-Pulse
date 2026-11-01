import * as React from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Text input. 16px base avoids iOS zoom (§15.2). Invalid state via aria-invalid. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-10 w-full rounded-sm border border-border-strong bg-surface px-3 text-base text-ink",
        "placeholder:text-muted transition-colors duration-150",
        "disabled:cursor-not-allowed disabled:opacity-45",
        "aria-[invalid=true]:border-danger aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-danger",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
