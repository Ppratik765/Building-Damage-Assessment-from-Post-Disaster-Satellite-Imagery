"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { DataProfile } from "@/lib/types";
import { PROFILES } from "@/lib/types";

interface ProfileSwitcherProps {
  currentProfile: DataProfile;
  siteCounts?: { data: number; data1: number };
  className?: string;
  onProfileChange?: (profile: DataProfile) => void;
}

export default function ProfileSwitcher({
  currentProfile,
  siteCounts = { data: 16, data1: 20 },
  className = "",
  onProfileChange,
}: ProfileSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = (profile: DataProfile) => {
    if (profile === currentProfile) return;
    if (onProfileChange) {
      onProfileChange(profile);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("profile", profile);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div
      className={`inline-flex items-center p-1 sm:p-1.5 rounded-2xl bg-slate-900/90 border border-slate-700/60 shadow-xl backdrop-blur-xl ${className}`}
      role="tablist"
      aria-label="Dataset Profile Switcher"
    >
      {(Object.keys(PROFILES) as DataProfile[]).map((key) => {
        const p = PROFILES[key];
        const isActive = currentProfile === key;
        const count = siteCounts[key];

        return (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            role="tab"
            aria-selected={isActive}
            className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
            }`}
          >
            {/* Active glowing indicator */}
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
            )}

            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-left">
              <span className="font-semibold tracking-tight">{p.shortName}</span>
              <span
                className={`text-[10px] sm:text-xs font-mono px-1.5 py-0.5 rounded-md ${
                  isActive
                    ? "bg-cyan-500/30 text-cyan-200"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {count} sites
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
