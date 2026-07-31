"use client";

import dynamic from "next/dynamic";

// Real, verifiable facts about Praeko itself — no usage/customer metrics,
// since there are no paying customers yet to measure. Mirrors the
// reference's "big number + globe + supporting stats" layout, but every
// number here is something the site can actually back up elsewhere on
// the page (agent count, plan count, connected networks).
const SUPPORTING_STATS = [
  { value: "3", label: "Planes, desde $99/mes" },
  { value: "3", label: "Redes sociales conectadas" },
  { value: "100%", label: "Contenido en español" },
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
          Cómo trabajamos
        </span>
        <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          Así de simple es publicar con Praeko
        </h2>
        <p className="mt-6 text-6xl font-semibold tracking-tight text-accent sm:text-7xl">5</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Agentes de IA trabajando por tu negocio, todos los días</p>
      </div>

      {/* No background box of its own — the globe sits directly on the
          section's own background and fades out at every edge (see
          Scene.tsx's radial mask), so it reads as part of the page
          instead of a photo pasted into a rectangle. */}
      <div className="mx-auto mt-14 h-[22rem] max-w-4xl sm:h-[28rem] md:h-[34rem]">
        <EarthScene className="h-full w-full" />
      </div>

      <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-8 px-6 text-center sm:grid-cols-3">
        {SUPPORTING_STATS.map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
