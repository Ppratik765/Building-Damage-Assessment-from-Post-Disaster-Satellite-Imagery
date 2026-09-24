"use client";

import { useId } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { DataProfile } from "@/lib/types";
import { PROFILES } from "@/lib/types";

interface ProfileSwitcherProps {
  currentProfile: DataProfile;
  siteCounts?: { data: number; data1: number };
  className?: string;
  onProfileChange?: (profile: DataProfile) => void;
  size?: "md" | "sm";
}

export default function ProfileSwitcher({
  currentProfile,
  siteCounts = { data: 16, data1: 20 },
  className = "",
  onProfileChange,
  size = "md",
}: ProfileSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pillId = useId();

  const handleSelect = (profile: DataProfile) => {
    if (profile === currentProfile) return;
    onProfileChange?.(profile);
    const params = new URLSearchParams(searchParams.toString());
    params.set("profile", profile);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";

  return (
    <div
      className={`panel inline-flex items-center gap-1 rounded-full p-1 ${className}`}
      role="tablist"
      aria-label="Dataset"
    >
      {(Object.keys(PROFILES) as DataProfile[]).map((key) => {
        const p = PROFILES[key];
        const isActive = currentProfile === key;
        return (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            role="tab"
            aria-selected={isActive}
            title={p.name}
            className={`relative rounded-full font-medium transition-colors duration-300 ${pad} ${
              isActive ? "text-ink" : "text-haze hover:text-paper"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={`profile-pill-${pillId}`}
                className="absolute inset-0 rounded-full bg-paper"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative flex items-center gap-2 whitespace-nowrap">
              {p.shortName}
              <span className={`tabular text-xs ${isActive ? "text-ink/60" : "text-faint"}`}>
                {siteCounts[key]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
