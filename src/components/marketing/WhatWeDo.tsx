"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AgentCylinderCarousel, { type CarouselAgent } from "@/components/marketing/AgentCylinderCarousel";

const AGENTS: CarouselAgent[] = [
  {
    title: "Agente de Estrategia",
    description: "Aprende el tono, los productos y el público de tu negocio, y arma el plan de contenido del mes.",
  },
  {
    title: "Agente Creativo",
    description: "Escribe el guion y genera cada video, imagen o carrusel — listo para publicar, no un borrador.",
  },
  {
    title: "Agente de Publicación",
    description: "Programa y publica cada pieza en el horario en que tu público realmente está activo.",
  },
  {
    title: "Agente de Respuestas",
    description: "Contesta precio, horario y disponibilidad en tus comentarios y mensajes directos.",
  },
  {
    title: "Agente de Resultados",
    description: "Mide qué contenido funciona de verdad y lo traduce a números que puedes entender.",
  },
];

export default function WhatWeDo() {
  const [activeIndex, setActiveIndex] = useState(0);

  function goTo(index: number) {
    setActiveIndex(Math.max(0, Math.min(AGENTS.length - 1, index)));
  }

  return (
    <section id="agentes" className="relative overflow-hidden py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500 dark:text-zinc-400">QUÉ HACEMOS</p>
            <h2 className="max-w-md text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
              Cinco agentes, un negocio que se publica solo
            </h2>
            <p className="mt-3 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">Arrastra o haz clic en una tarjeta para girar el carrusel.</p>
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Agente anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline)] text-zinc-500 transition-colors hover:border-accent hover:text-accent dark:text-zinc-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Siguiente agente"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline)] text-zinc-500 transition-colors hover:border-accent hover:text-accent dark:text-zinc-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards ride a CSS 3D ring (perspective + rotateY/translateZ per
          card), not a WebGL scene — dragging rotates the ring, clicking an
          adjacent card jumps straight to it. */}
      <div className="relative mt-8 h-[26rem] w-full sm:h-[30rem]">
        {/* A "stage" behind the ring — without this the cards just float on
            flat page background. Same radial-glow idea the Hero uses
            behind its own cube, kept subtle via opacity. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-40 dark:opacity-25"
          style={{
            background:
              "radial-gradient(ellipse 65% 70% at 50% 50%, var(--aurora-highlight) 0%, var(--accent) 45%, transparent 75%)",
          }}
        />
        <AgentCylinderCarousel className="h-full w-full" agents={AGENTS} activeIndex={activeIndex} onActiveIndexChange={goTo} />
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {AGENTS.map((agent, i) => (
          <button
            key={agent.title}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Ir a ${agent.title}`}
            className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-6 bg-accent" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"}`}
          />
        ))}
      </div>
    </section>
  );
}
