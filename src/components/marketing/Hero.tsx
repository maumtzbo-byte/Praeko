"use client";

import dynamic from "next/dynamic";
import { Sparkles, TrendingUp } from "lucide-react";
import LiquidMetalBackground from "./LiquidMetalBackground";

const LiquidMetalOrb = dynamic(() => import("@/components/three/LiquidMetalOrb"), {
  ssr: false,
});

export default function Hero() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden pb-16 pt-28 md:min-h-[92vh] md:justify-center md:pb-14">
      <LiquidMetalBackground />

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-8 px-6 md:grid-cols-[1fr_minmax(280px,420px)_1fr]">
        <div className="float-slow order-2 flex flex-col items-center gap-3 text-center md:order-1 md:items-end md:text-right">
          <Sparkles className="h-6 w-6 text-zinc-500" strokeWidth={1.25} />
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-zinc-800">
              CREAMOS
            </p>
            <p className="text-sm text-zinc-500">contenido que conecta.</p>
          </div>
        </div>

        <div className="relative order-1 aspect-square w-full max-w-[420px] justify-self-center md:order-2">
          <LiquidMetalOrb className="absolute inset-0" interactive />
        </div>

        <div
          className="float-slow order-3 flex flex-col items-center gap-3 text-center md:items-start md:text-left"
          style={{ animationDelay: "-3s" }}
        >
          <TrendingUp className="h-6 w-6 text-zinc-500" strokeWidth={1.25} />
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-zinc-800">
              IMPULSAMOS
            </p>
            <p className="text-sm text-zinc-500">marcas que impactan.</p>
          </div>
        </div>
      </div>

      <div className="relative mt-14 flex flex-col items-center gap-5 px-6 text-center md:mt-20">
        <p className="max-w-xs text-xs font-medium tracking-[0.25em] text-zinc-600 sm:max-w-none sm:text-sm sm:tracking-[0.35em]">
          ESTRATEGIA&nbsp;&nbsp;·&nbsp;&nbsp;CONTENIDO&nbsp;&nbsp;·&nbsp;&nbsp;RESULTADOS
        </p>
        <span className="rounded-full border border-zinc-300/80 bg-white/40 px-4 py-1.5 text-[11px] font-medium tracking-[0.2em] text-zinc-600 backdrop-blur-sm">
          MARKETING CON INTELIGENCIA
        </span>
      </div>
    </section>
  );
}
