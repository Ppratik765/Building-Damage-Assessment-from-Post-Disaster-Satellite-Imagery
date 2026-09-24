"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin Joint-Damage-Scale line along the top edge that tracks scroll depth. */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 180, damping: 30, mass: 0.3 });

  return (
    <motion.div
      aria-hidden
      className="spectrum-line fixed inset-x-0 top-0 z-[1000] h-[2px] origin-left"
      style={{ scaleX }}
    />
  );
}
