"use client";

import { useEffect, useState } from "react";
import type { DamageSummary } from "@/lib/types";
import { DAMAGE_COLORS, DAMAGE_LABELS } from "@/lib/types";

interface StatCardsProps {
  summary: DamageSummary;
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  delay: number;
}

function StatCard({ label, value, color, delay }: StatCardProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const timer = setTimeout(() => {
      const animate = (now: number) => {
        const elapsed = now - start - delay;
        if (elapsed < 0) {
          requestAnimationFrame(animate);
          return;
        }
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayed(Math.round(eased * value));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="glass-card p-3.5 sm:p-4 md:p-5 flex flex-col items-center gap-1.5 sm:gap-2 h-full justify-center">
      <div
        className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}50` }}
      />
      <span
        className="font-mono text-2xl sm:text-2xl md:text-3xl font-bold stat-number"
        style={{ color }}
      >
        {displayed}
      </span>
      <span className="text-[11px] sm:text-xs md:text-sm text-slate-400 text-center">
        {label}
      </span>
    </div>
  );
}

export default function StatCards({ summary }: StatCardsProps) {
  const cards: { label: string; value: number; color: string }[] = [
    {
      label: "Total Structures",
      value: summary.total_structures,
      color: "#22d3ee",
    },
    {
      label: DAMAGE_LABELS["no-damage"],
      value: summary.no_damage,
      color: DAMAGE_COLORS["no-damage"],
    },
    {
      label: DAMAGE_LABELS["minor-damage"],
      value: summary.minor_damage,
      color: DAMAGE_COLORS["minor-damage"],
    },
    {
      label: DAMAGE_LABELS["major-damage"],
      value: summary.major_damage,
      color: DAMAGE_COLORS["major-damage"],
    },
    {
      label: DAMAGE_LABELS["destroyed"],
      value: summary.destroyed,
      color: DAMAGE_COLORS["destroyed"],
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 md:gap-4 w-full">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={i === 0 ? "col-span-2 sm:col-span-1" : "col-span-1"}
        >
          <StatCard
            label={card.label}
            value={card.value}
            color={card.color}
            delay={i * 80}
          />
        </div>
      ))}
    </div>
  );
}
