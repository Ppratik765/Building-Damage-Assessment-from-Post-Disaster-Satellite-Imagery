import type { Manifest } from "@/lib/types";
import Link from "next/link";
import dynamic from "next/dynamic";
import StatCards from "@/components/StatCards";
import { notFound } from "next/navigation";

// Leaflet needs browser DOM — disable SSR
const SwipeMap = dynamic(() => import("@/components/SwipeMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] md:h-[600px] lg:h-[700px] rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <svg
          className="w-8 h-8 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <span className="text-sm">Loading map...</span>
      </div>
    </div>
  ),
});

async function getManifest(): Promise<Manifest> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "public", "data", "manifest.json");
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

interface SitePageProps {
  params: { id: string };
}

export async function generateStaticParams() {
  const manifest = await getManifest();
  return manifest.sites.map((site) => ({ id: site.id }));
}

export async function generateMetadata({ params }: SitePageProps) {
  const manifest = await getManifest();
  const site = manifest.sites.find((s) => s.id === params.id);
  return {
    title: site
      ? `${site.name} — Damage Assessment`
      : "Site Not Found",
    description: site
      ? `Damage assessment for ${site.name}: ${site.summary.total_structures} structures analyzed.`
      : "Site not found.",
  };
}

export default async function SitePage({ params }: SitePageProps) {
  const manifest = await getManifest();
  const site = manifest.sites.find((s) => s.id === params.id);

  if (!site) {
    notFound();
  }

  const sourceLabel =
    site.source === "xbd_test"
      ? "xView2 Test Set"
      : "Real-World Disaster Event";

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-accent-cyan transition-colors group"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="text-sm font-medium">All Sites</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
              {site.id}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-500">
              {sourceLabel}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        {/* Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{site.name}</h1>
            <p className="text-sm text-slate-500 mt-1 font-mono">
              {site.center.lat.toFixed(4)}°N, {site.center.lng.toFixed(4)}°
              {site.center.lng >= 0 ? "E" : "W"}
            </p>
          </div>
          <p className="text-sm text-slate-500">
            Drag the slider to compare pre- and post-disaster imagery
          </p>
        </div>

        {/* Map */}
        <SwipeMap site={site} />

        {/* Stats */}
        <StatCards summary={site.summary} />
      </div>
    </main>
  );
}
