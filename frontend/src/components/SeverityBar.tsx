"use client";

import { motion } from "framer-motion";
import type { DamageSummary } from "@/lib/types";
import { DAMAGE_COLORS, DAMAGE_LABELS } from "@/lib/types";
import { TIER_ORDER, TIER_SUMMARY_KEY } from "./siteFormat";

interface SeverityBarProps {
  summary: DamageSummary;
  className?: string;
  /** Tailwind height class */
  height?: string;
}

/** Stacked bar of the four damage tiers; segments grow into place. */
export default function SeverityBar({ summary, className = "", height = "h-1.5" }: SeverityBarProps) {
  const total = summary.total_structures;

  if (total === 0) {
    return (
      <div
        className={`${height} ${className} w-full rounded-full border border-dashed border-line`}
        aria-label="No buildings detected"
      />
    );
  }

  return (
    <div
      className={`${height} ${className} flex w-full gap-[2px] overflow-hidden rounded-full bg-line/40`}
      role="img"
      aria-label={TIER_ORDER.map((t) => `${DAMAGE_LABELS[t]}: ${summary[TIER_SUMMARY_KEY[t]]}`).join(", ")}
    >
      {TIER_ORDER.map((tier, i) => {
        const count = summary[TIER_SUMMARY_KEY[tier]];
        if (!count) return null;
        return (
          <motion.div
            key={tier}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: DAMAGE_COLORS[tier], flexBasis: 0, minWidth: 3 }}
            initial={{ flexGrow: 0 }}
            animate={{ flexGrow: count }}
            transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            title={`${DAMAGE_LABELS[tier]}: ${count}`}
          />
        );
      })}
    </div>
  );
}
