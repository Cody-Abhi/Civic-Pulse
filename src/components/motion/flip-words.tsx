"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useMounted } from "@/lib/use-mounted";
import { useSafeReducedMotion } from "@/lib/use-safe-reduced-motion";

interface FlipWordsProps {
  words: string[];
  interval?: number;
  className?: string;
}

export function FlipWords({ words, interval = 3000, className }: FlipWordsProps) {
  const mounted = useMounted();
  const reducedMotion = useSafeReducedMotion();
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % words.length);
  }, [words.length]);

  useEffect(() => {
    if (!mounted || reducedMotion) return;
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [mounted, reducedMotion, next, interval]);

  if (!mounted) {
    return <span className={className}>{words[0]}</span>;
  }

  return (
    <span
      className={cn("inline-block overflow-hidden align-bottom", className)}
      style={{ minWidth: "5ch" }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          className="inline-block"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
