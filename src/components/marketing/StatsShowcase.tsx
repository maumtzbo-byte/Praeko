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
          source. The footage has a baked-in near-white background
          (#fdfdfd, no alpha channel) — mix-blend-mode: multiply is what
          makes that read as "no background" instead of a card: multiplying
          white by the page's own light gray returns that same gray, so
          the video's background pixels disappear into the page while the
          globe's actual (darker) colors stay visible, just a hair
          deeper. Only works because the page is a fixed light color now
          that dark mode is gone — multiply against a dark background
          would have crushed the whole video to black. Sized off the
          source crop's own aspect ratio (650:368) so it's never
          letterboxed or cut off, on phone or desktop alike. */}
      <div className="mx-auto mt-14 max-w-md px-6 sm:max-w-lg md:max-w-2xl">
        <video
          className="block w-full mix-blend-multiply"
          style={{
            aspectRatio: "650 / 368",
            // The source clip cuts the sphere off flat at the bottom of
            // the frame — this mask fades that hard line to transparent
            // instead, so the globe reads as dissolving into the page
            // rather than being sliced by a rectangle.
            maskImage: "linear-gradient(to bottom, black 0%, black 78%, transparent 97%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 78%, transparent 97%)",
          }}
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
