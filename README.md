# Building Damage Assessment from Post-Disaster Satellite Imagery

An end-to-end deep learning and geospatial web platform for rapid automated building damage assessment following natural disasters.

Built on the **xBD dataset**, this repository contains:
1. **`notebook/`**: A self-contained PyTorch Siamese U-Net (`Siam-UNet-Diff`) training, validation, and evaluation pipeline optimized for single-GPU environments (Lightning AI Studio L4 GPU / CUDA or CPU dry-run), exporting standardized geo-referenced damage assessments.
2. **`frontend/`**: A modern Next.js 14 web application featuring an interactive before/after satellite image swipe comparison, classified damage vector overlays, summary analytics, and disaster site profiles.
3. **`docs/`**: Strict data contract defining the shared interface between ML inference outputs and the visualization frontend.

---

## 🌟 Architecture Overview

```
Satellite Imagery (Pre & Post)
         │
         ▼
┌──────────────────────────────────────────────┐
│  Siamese Feature Extraction (ResNet-34)      │
│  Shared weights for Pre- & Post-disaster     │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│  Feature Differencing & Skip Concatenation   │
│  |f_post - f_pre| combined with decoder      │
└──────────────────────────────────────────────┘
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
Localization Head             Damage Classification Head
(Binary Building Mask)        (4 Tiers: None, Minor, Major, Destroyed)
    └────┬────────────────────────┘
         ▼
Standardized Output Contract (`manifest.json`, GeoJSON, PNGs)
         │
         ▼
┌──────────────────────────────────────────────┐
│  Next.js 14 Geospatial Web Visualizer        │
│  - Split-view slider (Pre vs Post)           │
│  - Categorized damage polygon overlays       │
│  - Aggregate building impact statistics      │
└──────────────────────────────────────────────┘
```

---

## 🏗️ Damage Classification Tiers

Following the Joint Damage Scale (xBD standard):

| Tier | Class Label | Severity Description | Color Code |
|:----:|:------------|:---------------------|:----------:|
| **0** | No Damage | Undamaged structure, intact roof & walls | `#10b981` (Green) |
| **1** | Minor Damage | Partially damaged roof, missing tiles/gutters | `#f59e0b` (Amber) |
| **2** | Major Damage | Partial wall collapse, substantial roof compromise | `#f97316` (Orange) |
| **3** | Destroyed | Structure collapsed, total structural failure | `#ef4444` (Red) |

---

## 🚀 Getting Started

### 1. Training & Evaluation (`notebook/`)
The notebook `notebook/train_and_eval.ipynb` is designed to run self-contained:
- **Environment**: Lightning AI Studio with an L4 GPU (24GB VRAM) or local PyTorch installation.
- **Dataset**: Automatically downloads xBD disaster patches or uses existing directory structures.
- **Dry-run mode**: A built-in cell runs a fast synthetic-batch CPU dry run without requiring downloading 30GB+ xBD tarballs upfront.
- **Artifact Generation**: Outputs compliant `manifest.json`, `pre.png`, `post.png`, and `damage.geojson` directly into `frontend/public/data/<site_id>/`.

### 2. Visualization Frontend (`frontend/`)
The frontend is built with Next.js 14, Tailwind CSS, TypeScript, and React-Leaflet:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page, browse disaster sites, and inspect damage assessments in real-time.

To produce an optimized production build:
```bash
npm run build
npm run start
```

---

## 📑 Data Contract

To guarantee zero coupling between PyTorch training scripts and the frontend, all inference pipelines export to the directory format detailed in [`docs/data_contract.md`](docs/data_contract.md):

```
frontend/public/data/
├── manifest.json
└── <site_id>/
    ├── pre.png
    ├── post.png
    └── damage.geojson
```

---

## 🛡️ Tech Stack

- **Model & Training**: PyTorch, Torchvision, Albumentations, Shapely, GeoPandas, Matplotlib, scikit-learn
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, React-Leaflet, Lucide Icons
- **Fonts & Typography**: Inter (UI) & Fira Code (telemetry & metrics)
