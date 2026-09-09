import type { Manifest } from "@/lib/types";
import SiteCard from "@/components/SiteCard";

async function getManifest(): Promise<Manifest> {
  // At build time, read from the public directory via fs
  const fs = await import("fs/promises");
  const path = await import("path");
  const filePath = path.join(process.cwd(), "public", "data", "manifest.json");
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

export default async function HomePage() {
  const manifest = await getManifest();

  // Group by source
  const xbdSites = manifest.sites.filter((s) => s.source === "xbd_test");
  const oodSites = manifest.sites.filter((s) => s.source === "maxar_ood");

  const totalStructures = manifest.sites.reduce(
    (sum, s) => sum + s.summary.total_structures,
    0
  );
  const totalDestroyed = manifest.sites.reduce(
    (sum, s) => sum + s.summary.destroyed,
    0
  );

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-accent-green/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="flex flex-col items-center text-center gap-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              AI-Powered Satellite Analysis
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Building{" "}
              <span className="gradient-text">Damage Assessment</span>
            </h1>

            <p className="max-w-2xl text-slate-400 text-lg md:text-xl leading-relaxed">
              Interactive post-disaster satellite imagery analysis using Siamese
              change-detection neural networks. Compare pre- and post-disaster
              imagery with a swipe interface and explore AI-predicted damage
              classifications.
            </p>

            {/* Quick stats */}
            <div className="flex gap-8 mt-4">
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-accent-cyan">
                  {manifest.sites.length}
                </div>
                <div className="text-xs text-slate-500 mt-1">Sites</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-accent-green">
                  {totalStructures}
                </div>
                <div className="text-xs text-slate-500 mt-1">Structures</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-2xl font-bold text-damage-destroyed">
                  {totalDestroyed}
                </div>
                <div className="text-xs text-slate-500 mt-1">Destroyed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Site cards */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {/* xBD Test Set */}
        {xbdSites.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              <h2 className="text-sm font-semibold tracking-widest uppercase text-slate-500">
                xView2 Test Set
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {xbdSites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          </div>
        )}

        {/* Maxar OOD */}
        {oodSites.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
              <h2 className="text-sm font-semibold tracking-widest uppercase text-slate-500">
                Real-World Disaster Events
              </h2>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {oodSites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-xs text-slate-600">
          Building Damage Assessment • Siamese Change-Detection on xBD •{" "}
          <span className="font-mono">ResNet-50</span> Encoder
        </div>
      </footer>
    </main>
  );
}
