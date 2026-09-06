"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// Real numbers only, nothing invented to look like traction Frames
// doesn't have yet. "30" is every plan's video+image count added
// together (8+22, 15+15, 22+8 — all land on 30, just a different mix),
// "100%" is the product's actual language, and "7" is the number of
// agents actually listed further down this same page (see
// TeamSection.tsx) — no fabricated user/customer count. This said "5"
// while that section listed five; the Revisor de Marca and the Agente de
// Tendencias were already shipped and simply weren't being counted.
const SUPPORTING_STATS = [
  { value: "100%", label: "Contenido generado en español" },
  { value: "30", label: "Videos e imágenes cada mes, en cualquier plan" },
  { value: "7", label: "Agentes de IA trabajando por tu negocio" },
];

export default function StatsShowcase() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="inline-flex items-center rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white ">
          Beta abierta
        </span>
        <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Sé de los primeros negocios en usar Frames
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-600 sm:text-base">
          Estamos en beta: tu cuenta es real y tu contenido se genera y se
          publica de verdad — seguimos puliendo cosas, y tu opinión nos ayuda
          a mejorar rápido.
        </p>
        <Link
          href="/registro"
          className="mt-6 inline-flex rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Únete a la beta
        </Link>
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
