"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    title: "Pair the tiles",
    body: "Take a satellite tile from before the disaster and one from after, covering the same ground.",
  },
  {
    title: "Encode both the same way",
    body: "A Siamese ResNet-34 encoder with shared weights turns each tile into features, so any difference comes from the ground, not the network.",
  },
  {
    title: "Subtract to find change",
    body: "The difference |f_post − f_pre| is fused with the decoder’s skip connections to highlight what changed.",
  },
  {
    title: "Locate and grade",
    body: "One head outlines every building. The other grades each one on the Joint Damage Scale, from no damage to destroyed.",
  },
];

export default function Pipeline() {
  return (
    <div className="relative">
      {/* Connecting track (desktop) */}
      <div aria-hidden className="absolute left-0 right-0 top-[15px] hidden h-px lg:block">
        <motion.div
          className="h-full origin-left bg-line"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 1.2, ease: [0.65, 0, 0.35, 1] }}
        />
        <div className="absolute inset-0 overflow-hidden">
          <div className="spectrum-line h-full w-[10%] animate-pulse-travel rounded-full blur-[0.5px]" />
        </div>
      </div>

      <ol className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {STEPS.map((step, i) => (
          <motion.li
            key={step.title}
            className="relative"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.6, delay: 0.25 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-ink font-mono text-xs text-signal">
              {i + 1}
            </span>
            <h3 className="type-wide mt-5 text-xl font-semibold text-paper">{step.title}</h3>
            <p className="mt-2 max-w-[34ch] text-[0.95rem] leading-relaxed text-haze">{step.body}</p>
          </motion.li>
        ))}
      </ol>

      <p className="mt-12 max-w-2xl text-[0.95rem] leading-relaxed text-haze">
        Every run exports building polygons as GeoJSON plus a per-site summary. This site reads those files directly,
        so what you see on each map is exactly what the model predicted.
      </p>
    </div>
  );
}
