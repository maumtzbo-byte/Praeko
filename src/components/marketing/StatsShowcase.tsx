"use client";

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

export default function StatsShowcase() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="inline-flex items-center rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white ">
          Creciendo en México
        </span>
        <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Negocios como el tuyo ya están en Frames
        </h2>
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-6 text-7xl font-semibold tracking-tight text-accent sm:text-8xl md:text-9xl"
        >
          100+
        </motion.p>
        <p className="mt-2 text-sm text-zinc-500">Negocios registrados, listos para publicar con IA</p>
      </div>

      {/* The real reference clip, not a re-built 3D scene — a rotating
          globe render already cropped to a clean hemisphere at the
          source. Framed in a plain white card (not bled onto the page)
          because the footage has a baked-in white background with no
          alpha channel — a card reads as intentional in both themes,
          where trying to blend a hard-coded white background into a
          dark page never would. Sized off the source crop's own aspect
          ratio (650:368) so it's never letterboxed or cut off, on phone
          or desktop alike. */}
      <div className="mx-auto mt-14 max-w-md px-6 sm:max-w-lg md:max-w-2xl">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_-40px_rgba(0,0,0,0.35)] sm:rounded-[2.5rem]">
          <video
            className="block w-full"
            style={{ aspectRatio: "650 / 368" }}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            {/* webm first: smaller, and it's the one format guaranteed
                present in every Chromium build without a licensed H.264
                decoder. mp4 covers Safari, which never plays webm. */}
            <source src="/videos/earth-globe.webm" type="video/webm" />
            <source src="/videos/earth-globe.mp4" type="video/mp4" />
          </video>
        </div>
      </div>

      {/* Always 3 across, even on phones — stacked, these ate a whole
          screen of vertical space for three short numbers. Sized up for
          impact, not just legibility — these are meant to land the same
          way the headline figure does, not read as fine print under it. */}
      <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-3 px-6 text-center sm:gap-8">
        {SUPPORTING_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
          >
            <p className="text-3xl font-semibold tracking-tight text-accent sm:text-5xl">{stat.value}</p>
            <p className="mt-1 text-xs leading-tight text-zinc-500 sm:text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
