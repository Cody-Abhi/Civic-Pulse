"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

interface TextGenerateProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

export function TextGenerate({
  text,
  className,
  delay = 0,
  stagger = 0.02,
}: TextGenerateProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const prefersReduced = useReducedMotion();
  const words = text.split(" ");

  if (prefersReduced) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span ref={ref} className={cn("inline", className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={{ opacity: 0, filter: "blur(4px)" }}
          animate={inView ? { opacity: 1, filter: "blur(0px)" } : {}}
          transition={{
            duration: 0.3,
            delay: delay + i * stagger,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          {word}{i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}
