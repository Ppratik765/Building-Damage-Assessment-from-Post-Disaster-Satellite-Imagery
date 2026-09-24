"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  duration?: number;
}

/** Counts up the first time it scrolls into view, then tweens between values. */
export default function AnimatedNumber({ value, className = "", duration = 1.1 }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const current = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!inView || !el) return;
    if (reduce) {
      current.current = value;
      el.textContent = value.toLocaleString("en-IN");
      return;
    }
    const controls = animate(current.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        current.current = v;
        el.textContent = Math.round(v).toLocaleString("en-IN");
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={`tabular ${className}`}>
      0
    </span>
  );
}
