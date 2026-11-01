"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(cb: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return true;
}

export function useSafeReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
