"use client";

import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/pricing/format";

const DURATION_MS = 650;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Counts up/down to a new dollar amount (jumps straight there with reduced motion). */
export function AnimatedMoney({ value, from = value }: { value: number; from?: number }) {
  const [display, setDisplay] = useState(from);
  const previous = useRef<number>(from);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const start = previous.current;
    previous.current = value;
    if (start === value || prefersReducedMotion()) {
      frame.current = requestAnimationFrame(() => setDisplay(value));
      return () => {
        if (frame.current) cancelAnimationFrame(frame.current);
      };
    }
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / DURATION_MS);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(start + (value - start) * eased));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [value]);

  return <>{formatMoney(display)}</>;
}
