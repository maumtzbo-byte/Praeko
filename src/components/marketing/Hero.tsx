"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import LiquidMetalBackground from "./LiquidMetalBackground";

const LiquidMetalOrb = dynamic(() => import("@/components/three/LiquidMetalOrb"), {
  ssr: false,
});

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden pb-16 pt-28 md:pb-20 md:pt-36">
      <LiquidMetalBackground />

      {/* Real value proposition first — what Praeko does, in plain words —
          instead of the abstract "CREAMOS / IMPULSAMOS" pair that used to
          flank the orb. Those read as decorative brand copy, not
          information: a first-time visitor couldn't tell from them what
          Praeko actually is or does. */}
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center">
        <span className="rounded-full border border-zinc-300/80 bg-white/40 px-4 py-1.5 text-[11px] font-medium tracking-[0.2em] text-zinc-600 backdrop-blur-sm">
          MARKETING CON INTELIGENCIA
        </span>
        <h1 className="text-balance font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
          Agentes de IA que crean y publican el contenido de tu negocio
        </h1>
        <p className="max-w-lg text-balance text-zinc-600 sm:text-lg">
          Videos, imágenes y carruseles listos para tus redes, todos los días
          — sin que grabes, edites ni programes nada.
        </p>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/registro"
            className="rounded-full bg-zinc-950 px-7 py-3 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] transition-all hover:scale-[1.03] hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_0_0_4px_rgba(224,122,53,0.18)]"
          >
            Empieza gratis
          </Link>
          <a
            href="#agentes"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
          >
            Cómo funciona →
          </a>
        </div>
      </div>

      {/* The orb stays as a supporting visual, not the whole first
          viewport — capped smaller on mobile so it no longer pushes the
          message and CTA below the fold. */}
      <div className="relative mt-10 aspect-square w-full max-w-[260px] sm:max-w-[340px] md:mt-14 md:max-w-[400px]">
        <LiquidMetalOrb className="absolute inset-0" interactive />
      </div>
    </section>
  );
}
