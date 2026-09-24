"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Expand, X } from "lucide-react";

const FIGURES = [
  {
    id: "confusion",
    src: "/data/confusion_matrix.png",
    width: 1200,
    height: 900,
    title: "Confusion matrix",
    caption:
      "How often each true damage tier was predicted as each tier on the test set: no damage (0), minor (1), major (2) and destroyed (3).",
  },
  {
    id: "predictions",
    src: "/data/test_predictions.png",
    width: 2378,
    height: 2429,
    title: "Test predictions",
    caption: "Before and after tiles next to the ground-truth building mask and the model’s predicted damage classes.",
  },
];

export default function ModelGallery() {
  const [open, setOpen] = useState<string | null>(null);
  const active = FIGURES.find((f) => f.id === open) ?? null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {FIGURES.map((fig) => (
          <figure key={fig.id} className="group">
            <button
              onClick={() => setOpen(fig.id)}
              className="relative block w-full overflow-hidden rounded-[22px] bg-paper p-3 text-left"
              aria-label={`Enlarge: ${fig.title}`}
            >
              <motion.div layoutId={`figure-${fig.id}`} className="relative aspect-[4/3] w-full">
                <Image
                  src={fig.src}
                  alt={fig.title}
                  fill
                  sizes="(min-width: 768px) 600px, 100vw"
                  className="object-contain"
                />
              </motion.div>
              <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-ink/85 text-paper opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                <Expand className="h-4 w-4" />
              </span>
            </button>
            <figcaption className="mt-4">
              <p className="type-wide text-lg font-semibold text-paper">{fig.title}</p>
              <p className="mt-1 max-w-[60ch] text-[0.95rem] leading-relaxed text-haze">{fig.caption}</p>
            </figcaption>
          </figure>
        ))}
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[1100] flex items-center justify-center p-4 sm:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label={active.title}
          >
            <button
              aria-label="Close"
              className="absolute inset-0 bg-ink/85 backdrop-blur-md"
              onClick={() => setOpen(null)}
            />
            <div className="relative flex max-h-full w-full max-w-5xl flex-col items-center gap-4">
              <motion.div
                layoutId={`figure-${active.id}`}
                className="relative w-full overflow-hidden rounded-[22px] bg-paper"
                style={{ aspectRatio: `${active.width} / ${active.height}`, maxHeight: "80vh" }}
              >
                <Image src={active.src} alt={active.title} fill sizes="90vw" className="object-contain p-3" />
              </motion.div>
              <p className="relative text-center text-sm text-haze">{active.caption}</p>
              <button
                onClick={() => setOpen(null)}
                className="absolute -top-2 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink sm:-right-14 sm:top-0"
                aria-label="Close"
                autoFocus
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
