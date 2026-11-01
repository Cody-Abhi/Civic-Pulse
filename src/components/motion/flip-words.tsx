"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";

interface FlipWordsProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function FlipWords({ words, interval = 3000, className }: FlipWordsProps) {
  const [index, setIndex] = useState(0);
  const prefersReduced = useReducedMotion();

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % words.length);
  }, [words.length]);

  useEffect(() => {
    if (prefersReduced) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [next, interval, prefersReduced]);

  if (prefersReduced) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span className={cn("inline-block overflow-hidden", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className="inline-block"
          initial={{ y: "100%", opacity: 0, rotateX: -90 }}
          animate={{ y: 0, opacity: 1, rotateX: 0 }}
          exit={{ y: "-100%", opacity: 0, rotateX: 90 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ perspective: 200 }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
