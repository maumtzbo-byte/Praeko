"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Real numbers only. "100+ negocios registrados" is an actual figure the
// user confirmed (registered/waitlisted businesses, not a fabricated
// usage metric) — everything else here is something the site can back up
// elsewhere on the page (agent count, plan count, connected networks).
const SUPPORTING_STATS = [
  { value: "5", label: "Agentes de IA trabajando por ti" },
  { value: "3", label: "Planes, desde $99/mes" },
  { value: "3", label: "Redes sociales conectadas" },
];

// Client-only — WebGL has no server-side representation, and the ~1MB of
// Earth textures plus the three.js/@react-three chunk have no business in
// the initial page bundle for something this far down the page.
const EarthScene = dynamic(() => import("@/components/three/earth/Scene"), { ssr: false });

export default function StatsShowcase() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="inline-flex items-center rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-zinc-950">
          Creciendo en México
        </span>
        <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          Negocios como el tuyo ya están en Praeko
        </h2>
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-6 text-6xl font-semibold tracking-tight text-accent sm:text-7xl"
        >
          100+
        </motion.p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Negocios registrados, listos para publicar con IA</p>
      </div>

      {/* No background box of its own — the globe sits directly on the
          section's own background and fades out at every edge (see
          Scene.tsx's radial mask), so it reads as part of the page
          instead of a photo pasted into a rectangle. */}
      <div className="mx-auto mt-14 h-[22rem] max-w-4xl sm:h-[28rem] md:h-[34rem]">
        <EarthScene className="h-full w-full" />
      </div>

      {/* Always 3 across, even on phones — stacked, these ate a whole
          screen of vertical space for three short numbers. */}
      <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-3 px-6 text-center sm:gap-8">
        {SUPPORTING_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
          >
            <p className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">{stat.value}</p>
            <p className="mt-1 text-[11px] leading-tight text-zinc-500 sm:text-sm dark:text-zinc-400">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
