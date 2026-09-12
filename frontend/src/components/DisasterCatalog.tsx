"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { Manifest, DataProfile } from "@/lib/types";
import { PROFILES } from "@/lib/types";
import SiteCard from "@/components/SiteCard";
import ProfileSwitcher from "@/components/ProfileSwitcher";

interface DisasterCatalogProps {
  manifests: {
    data: Manifest;
    data1: Manifest;
  };
  initialProfile?: DataProfile;
}

export default function DisasterCatalog({
  manifests,
  initialProfile = "data",
}: DisasterCatalogProps) {
  const searchParams = useSearchParams();

  // Profile selection
  const profileParam = (searchParams.get("profile") as DataProfile) || initialProfile;
  const validProfile: DataProfile = profileParam in PROFILES ? profileParam : "data";
  const [currentProfile, setCurrentProfile] = useState<DataProfile>(validProfile);

  useEffect(() => {
    if (profileParam in PROFILES && profileParam !== currentProfile) {
      setCurrentProfile(profileParam);
    }
  }, [profileParam, currentProfile]);

  // Category and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const currentManifest = manifests[currentProfile] || manifests.data;
  const sites = currentManifest.sites;

  // Aggregate stats for current profile
  const totalStructures = useMemo(
    () => sites.reduce((sum, s) => sum + (s.summary?.total_structures || 0), 0),
    [sites]
  );
  const totalDestroyed = useMemo(
    () => sites.reduce((sum, s) => sum + (s.summary?.destroyed || 0), 0),
    [sites]
  );
  const totalMajor = useMemo(
    () => sites.reduce((sum, s) => sum + (s.summary?.major_damage || 0), 0),
    [sites]
  );

  // Filtered sites
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        site.name.toLowerCase().includes(q) ||
        site.id.toLowerCase().includes(q) ||
        (site.disaster_type && site.disaster_type.toLowerCase().includes(q)) ||
        (site.location_name && site.location_name.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (selectedCategory === "all") return true;

      const nameLower = site.name.toLowerCase();
      const typeLower = (site.disaster_type || "").toLowerCase();

      if (selectedCategory === "flood") {
        return (
          nameLower.includes("flood") ||
          typeLower.includes("flood") ||
          nameLower.includes("water")
        );
      }
      if (selectedCategory === "earthquake") {
        return (
          nameLower.includes("earthquake") ||
          typeLower.includes("earthquake") ||
          nameLower.includes("jajarkot")
        );
      }
      if (selectedCategory === "hurricane") {
        return (
          nameLower.includes("hurricane") ||
          nameLower.includes("typhoon") ||
          typeLower.includes("hurricane")
        );
      }
      if (selectedCategory === "fire") {
        return nameLower.includes("fire") || typeLower.includes("fire");
      }

      return true;
    });
  }, [sites, searchQuery, selectedCategory]);

  return (
    <div className="space-y-8">
      {/* Profile Selector Banner */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-xs uppercase font-mono tracking-widest text-slate-400">
          Select Data Profile
        </div>
        <ProfileSwitcher
          currentProfile={currentProfile}
          onProfileChange={setCurrentProfile}
          siteCounts={{
            data: manifests.data.sites.length,
            data1: manifests.data1.sites.length,
          }}
        />
        <p className="text-xs text-slate-400 max-w-lg">
          {PROFILES[currentProfile].description}
        </p>
      </div>

      {/* Profile Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
        <div className="glass-card p-3 sm:p-4 text-center rounded-xl border border-slate-800">
          <div className="font-mono text-xl sm:text-2xl font-bold text-cyan-400">
            {sites.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total Sites</div>
        </div>
        <div className="glass-card p-3 sm:p-4 text-center rounded-xl border border-slate-800">
          <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-400">
            {totalStructures}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Structures Analyzed</div>
        </div>
        <div className="glass-card p-3 sm:p-4 text-center rounded-xl border border-slate-800">
          <div className="font-mono text-xl sm:text-2xl font-bold text-orange-400">
            {totalMajor}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Major Damage</div>
        </div>
        <div className="glass-card p-3 sm:p-4 text-center rounded-xl border border-slate-800">
          <div className="font-mono text-xl sm:text-2xl font-bold text-red-400">
            {totalDestroyed}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Destroyed</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            {
              id: "all",
              label: "All Disasters",
              icon: (active: boolean) => (
                <svg
                  className={`w-3.5 h-3.5 ${active ? "text-slate-900" : "text-slate-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              ),
            },
            {
              id: "flood",
              label: "Flooding",
              icon: (active: boolean) => (
                <svg
                  className={`w-3.5 h-3.5 ${active ? "text-slate-900" : "text-cyan-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M3 19c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M3 11c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"
                  />
                </svg>
              ),
            },
            {
              id: "earthquake",
              label: "Earthquake",
              icon: (active: boolean) => (
                <svg
                  className={`w-3.5 h-3.5 ${active ? "text-slate-900" : "text-amber-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2 12h4l3-7 4 14 3-9 2 4h4"
                  />
                </svg>
              ),
            },
            {
              id: "hurricane",
              label: "Wind & Storm",
              icon: (active: boolean) => (
                <svg
                  className={`w-3.5 h-3.5 ${active ? "text-slate-900" : "text-teal-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2"
                  />
                </svg>
              ),
            },
            {
              id: "fire",
              label: "Wildfire",
              icon: (active: boolean) => (
                <svg
                  className={`w-3.5 h-3.5 ${active ? "text-slate-900" : "text-red-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.879 16.121A3 3 0 1012.001 11c-.5 1-1.5 2-2.122 5.121z"
                  />
                </svg>
              ),
            },
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-slate-200 text-slate-900 font-semibold shadow-md"
                    : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {cat.icon(isActive)}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search disaster or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-1.5 pl-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70 transition-colors"
          />
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Grid of Site Cards */}
      {filteredSites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredSites.map((site) => (
            <SiteCard key={site.id} site={site} profile={currentProfile} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <p className="text-slate-400 text-sm">
            No disaster sites match your search or filter criteria.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
            className="mt-3 text-xs text-cyan-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
