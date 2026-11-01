"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "motion/react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  distance?: number;
  once?: boolean;
}

const getVariants = (direction: FadeInProps["direction"], distance: number): Variants => {
  const hidden: Record<string, number> = { opacity: 0 };
  if (direction === "up") hidden.y = distance;
  if (direction === "down") hidden.y = -distance;
  if (direction === "left") hidden.x = distance;
  if (direction === "right") hidden.x = -distance;

  return {
    hidden,
    visible: { opacity: 1, x: 0, y: 0 },
  };
};

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  direction = "up",
  distance = 24,
  once = true,
}: FadeInProps) {
  return (
    <motion.div
      className={className}
      variants={getVariants(direction, distance)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-40px" }}
      transition={{
        duration,
        delay,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
