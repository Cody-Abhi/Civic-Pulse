import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, type ButtonProps } from "./button";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  icon: LucideIcon;
  size?: number;
  /** Provide a label to make the icon meaningful to assistive tech. */
  label?: string;
}

/** Lucide wrapper enforcing a consistent 1.75 stroke (§15.5). */
export function Icon({ icon: IconComponent, size = 20, label, className, ...rest }: IconProps) {
  return (
    <IconComponent
      width={size}
      height={size}
      strokeWidth={1.75}
      className={cn("shrink-0", className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      {...rest}
    />
  );
}

export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  icon: LucideIcon;
  /** Required: icon-only buttons must have an accessible name (§15.5). */
  "aria-label": string;
  iconSize?: number;
}

/** Square icon-only button; `aria-label` is required by the type. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, iconSize = 20, variant = "ghost", ...props }, ref) => (
    <Button ref={ref} size="icon" variant={variant} {...props}>
      <Icon icon={icon} size={iconSize} />
    </Button>
  ),
);
IconButton.displayName = "IconButton";
