"use client";

import { motion, useReducedMotion } from "motion/react";
import { Bell } from "lucide-react";
import { Icon } from "@/components/ui/icon";

interface NotificationBellProps {
  hasNotifications?: boolean;
  count?: number;
  className?: string;
  onClick?: () => void;
}

export function NotificationBell({
  hasNotifications = false,
  count,
  className,
  onClick,
}: NotificationBellProps) {
  const prefersReduced = useReducedMotion();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-sunken ${className ?? ""}`}
      aria-label={`Notifications${count ? ` (${count})` : ""}`}
    >
      <motion.div
        animate={
          hasNotifications && !prefersReduced
            ? {
                rotate: [0, 12, -12, 8, -8, 4, -4, 0],
              }
            : {}
        }
        transition={{
          duration: 0.6,
          repeat: Infinity,
          repeatDelay: 4,
          ease: "easeInOut",
        }}
      >
        <Icon icon={Bell} size={20} className="text-muted" />
      </motion.div>
      {hasNotifications && (
        <motion.span
          className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-on-primary"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.2 }}
        >
          {count ?? ""}
        </motion.span>
      )}
    </button>
  );
}
