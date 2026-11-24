# Damage Assessment from Post-Disaster Satellite Imagery

An end-to-end deep learning and geospatial web platform for automated building localization and damage grading from pre- and post-disaster satellite imagery.

Built on the **xBD dataset** and **Maxar Open Data** disaster imagery, this repository contains:

1. **`notebook/`**: A self-contained PyTorch Siamese FPN network (`SiameseDamageNet`, ResNet-50 backbone) training, validation, and evaluation pipeline optimized for single-GPU environments (NVIDIA L4 GPU / CUDA or CPU dry-run), exporting standardized damage assessments.
2. **`frontend/`**: A Next.js 14 web application featuring an interactive before/after satellite swipe comparison, toggleable damage vector overlays, dual dataset profiles (`data` and `data1`), keyboard navigation, and training evaluation visualizations.
3. **`docs/`**: Strict data contract defining the shared interface between ML inference outputs and the visualization frontend.

---

## Architecture Overview

```text
Satellite Imagery (Pre & Post, 1024x1024)
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Shared-Weight Siamese Encoder (ResNet-50, ImageNet weights)   │
│  Extracts 5-stage multi-scale feature pyramids F_pre, F_post   │
└────────────────────────────────────────────────────────────────┘
         │
    ┌────┴────────────────────────────────────────┐
    ▼                                             ▼
Localization FPN Decoder                 Damage FPN Decoder
Input: F_pre (top 4 pyramid levels)      Input: [|F_pre - F_post| || F_post]
Loss:  BCE + Dice                        Loss:  Class-weighted Cross-Entropy
Output: Binary building mask             Output: 4-tier damage grade
    └────┬────────────────────────────────────────┘
         ▼
Standardized Output Contract (`manifest.json`, GeoJSON, PNGs)
         │
         ▼
┌────────────────────────────────────────────────────────────────┐
│  Next.js 14 Geospatial Web Visualizer                          │
│  - Interactive pre/post swipe divider (Leaflet / React-Leaflet)│
│  - Toggleable per-tier building damage polygon overlays        │
│  - Dual dataset profiles (Benchmark & Disasters / Maxar OOD)   │
│  - Evaluation gallery (confusion matrix & test predictions)    │
└────────────────────────────────────────────────────────────────┘
```

- **Model**: `SiameseDamageNet` (~27.3M parameters), pairing a shared `resnet50` encoder (`segmentation-models-pytorch`, ImageNet pretrained) with two lightweight `FPNDecoder` heads (`decoder_dim=128`, top 4 pyramid levels).
- **Change Fusion**: The same ResNet-50 encoder reads the before and the after image. We take the absolute difference of their features (`|F_pre - F_post|`, what changed) and concatenate it with the after features (`F_post`, what the building looks like now) before decoding into per-building damage grades.

---

## Evaluation Results

Trained at full `1024x1024` resolution with `AdamW` (`lr=1e-4`, `weight_decay=1e-5`) and `bfloat16` mixed precision on an NVIDIA L4 GPU across 2,781 filtered xBD training pairs (best checkpoint at epoch 7, early stopping at epoch 10):

| Metric | Test Set Score |
|:-------|:--------------:|
| **Localization F1** (binary) | `0.8089` |
| **Damage F1 (Macro)** (building pixels) | `0.7055` |
| — No Damage (Tier 0) | `0.9161` |
| — Minor Damage (Tier 1) | `0.4056` |
| — Major Damage (Tier 2) | `0.6899` |
| — Destroyed (Tier 3) | `0.8104` |
| **Weighted Score** (`0.3 × Loc F1 + 0.7 × Damage Macro F1`) | `0.7365` |

---

## Damage Classification Tiers

Following the xBD Joint Damage Scale:

| Tier | Class Label | Severity Description | Color Code |
|:----:|:------------|:---------------------|:----------:|
| **0** | No Damage | Undamaged structure, intact roof & walls | `#22c55e` (Green) |
| **1** | Minor Damage | Partially damaged roof, missing tiles/gutters | `#eab308` (Yellow) |
| **2** | Major Damage | Partial wall collapse, substantial roof compromise | `#f97316` (Orange) |
| **3** | Destroyed | Structure collapsed, total structural failure | `#ef4444` (Red) |

---

## Datasets & Profiles

The frontend exposes two selectable dataset profiles under `frontend/public/`:

- **`data/` — Benchmark & Disasters (`xBD + Real`)**: 16 scenes combining 4 xBD test-set tiles (`Socal Fire`, `Hurricane Matthew`, `Midwest Flooding`, `Hurricane Harvey`) with 12 Maxar Open Data scenes (`Jajarkot Earthquake, Nepal`, `Nepal Floods 2024`, `Sikkim GLOF Floods, India`), plus `confusion_matrix.png` and `test_predictions.png`.
- **`data1/` — Pure Real-World Satellite (`Maxar OOD`)**: 20 Maxar Open Data scenes covering `Sikkim Flash Floods, India (Teesta Basin)` and `Jajarkot Earthquake, Nepal`.

---

## Getting Started

### 1. Training & Evaluation (`notebook/`)

The notebook [`notebook/train_and_eval.ipynb`](notebook/train_and_eval.ipynb) is self-contained:

- **Environment**: Designed for Lightning AI Studio with an NVIDIA L4 GPU (24 GB VRAM) or local PyTorch with CUDA.
- **Dataset**: Streams/caches the `train` split of `hannan022/xview2-xbd` via HuggingFace `datasets` (~8 GB on-disk Arrow cache, filtered to hurricane, typhoon, earthquake, flooding, flood, tsunami, and fire disasters; `NUM_WORKERS=0` avoids Arrow copy-on-write RAM growth).
- **Dry-run mode**: Cell 13 runs a synthetic-batch CPU dry run (`256x256`) covering forward pass, loss computation, backward step, checkpoint save/load, and export without downloading the dataset.
- **Optional extensions**: Includes optional ordinal damage loss (Cell 12) and Maxar Open Data STAC OOD inference & manifest export (Cells 14–18).
- **Artifact Generation**: Exports `manifest.json`, `pre.png`, `post.png`, `damage.geojson`, `confusion_matrix.png`, and `test_predictions.png`.

### 2. Visualization Frontend (`frontend/`)

Built with Next.js 14 (App Router), Tailwind CSS, TypeScript, Framer Motion, and React-Leaflet:

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to explore the hero scanner, filter scenes by disaster category or dataset profile, swipe between pre/post satellite imagery, toggle individual damage tiers, or press `?` on a site page for keyboard shortcuts.

To produce an optimized production build:

```bash
npm run build
npm run start
```

---

## Data Contract

To keep the PyTorch training notebook and Next.js frontend decoupled, all inference outputs conform to [`docs/data_contract.md`](docs/data_contract.md):

```text
frontend/public/
├── data/                         # Benchmark & Disasters profile
│   ├── manifest.json
│   ├── confusion_matrix.png
│   ├── test_predictions.png
│   └── <site_id>/
│       ├── pre.png
│       ├── post.png
│       └── damage.geojson
└── data1/                        # Pure Real-World Satellite profile
    ├── manifest.json
    └── <site_id>/
        ├── pre.png
        ├── post.png
        └── damage.geojson
```

---

## Tech Stack

- **Model & Training**: PyTorch 2.5, Torchvision, `segmentation-models-pytorch`, HuggingFace `datasets`, Albumentations, OpenCV, Rasterio, Shapely, GeoPandas, Matplotlib, scikit-learn, SciPy, `pystac-client`, `leafmap`, `rio-tiler`
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, React-Leaflet / Leaflet, Lucide Icons
- **Fonts & Typography**: Self-hosted Archivo Variable (`@fontsource-variable/archivo`) & IBM Plex Mono (`@fontsource/ibm-plex-mono`)
