import { getManifest } from "@/lib/data";
import type { DataProfile } from "@/lib/types";
import DisasterCatalog from "@/components/DisasterCatalog";

interface HomePageProps {
  searchParams?: { profile?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const [dataManifest, data1Manifest] = await Promise.all([
    getManifest("data"),
    getManifest("data1"),
  ]);

  const initialProfile: DataProfile =
    searchParams?.profile === "data1" ? "data1" : "data";

  return (
    <main className="min-h-screen pb-20">
      {/* Top Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-10 sm:pt-20 sm:pb-14">
        {/* Glow ambient background orbs */}
        <div className="absolute -top-32 -left-32 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 -right-20 w-72 sm:w-80 h-72 sm:h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center space-y-5">
          {/* Tag badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] sm:text-xs font-mono text-cyan-300 shadow-xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>Siamese Change-Detection Network • Joint Damage Scale</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
            Building <span className="gradient-text">Damage Assessment</span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
            Automated post-disaster satellite imagery damage mapping. Compare
            pre- and post-disaster satellite tiles with a draggable split-view
            slider and inspect AI-localized damage polygons.
          </p>
        </div>
      </section>

      {/* Main Interactive Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <DisasterCatalog
          manifests={{ data: dataManifest, data1: data1Manifest }}
          initialProfile={initialProfile}
        />
      </section>

      {/* Evaluation & Model Insights Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mt-20 pt-12 border-t border-slate-800/80 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
            Model Evaluation & Training Metrics
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Artifacts generated directly by the PyTorch Siamese U-Net training pipeline on the xBD benchmark.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Confusion Matrix Asset */}
          <div className="glass-card p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-semibold text-slate-200">
                4-Class Confusion Matrix
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400">
                Test Set Metrics
              </span>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 p-1">
              <img
                src="/data/confusion_matrix.png"
                alt="Model Confusion Matrix"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
            <p className="text-xs text-slate-500">
              Evaluates tier classification: No Damage (0), Minor Damage (1), Major Damage (2), and Destroyed (3).
            </p>
          </div>

          {/* Test Predictions Sample Asset */}
          <div className="glass-card p-4 sm:p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-semibold text-slate-200">
                Model Inference Test Visuals
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                Prediction Samples
              </span>
            </div>
            <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 p-1">
              <img
                src="/data/test_predictions.png"
                alt="Model Test Predictions"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>
            <p className="text-xs text-slate-500">
              Side-by-side comparison of pre-event, post-event, ground truth localization, and predicted damage classifications.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 pt-8 border-t border-slate-900 text-center text-xs text-slate-500">
        <p>
          Building Damage Assessment from Satellite Imagery • Next.js 14 Geospatial Dashboard • PyTorch Siamese U-Net
        </p>
      </footer>
    </main>
  );
}
