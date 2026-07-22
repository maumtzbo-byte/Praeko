"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CarouselAgent } from "@/components/three/AgentCarousel3D";

const AgentCarousel3D = dynamic(() => import("@/components/three/AgentCarousel3D"), { ssr: false });

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
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [carouselVisible, setCarouselVisible] = useState(false);

  // Pauses the WebGL frameloop once the section scrolls off-screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setCarouselVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setCarouselVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function goTo(index: number) {
    setActiveIndex(Math.max(0, Math.min(AGENTS.length - 1, index)));
  }

  return (
    <section ref={sectionRef} id="agentes" className="relative overflow-hidden py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500 dark:text-zinc-400">QUÉ HACEMOS</p>
            <h2 className="max-w-md text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
              Cinco agentes, un negocio que se publica solo
            </h2>
            <p className="mt-3 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">Arrastra para girar la cámara alrededor.</p>
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

      {/* The whole "what we do" moment is one immersive 3D scene now — the
          cube and every agent card are real meshes in the same canvas, not
          HTML laid over a decorative background. Dragging orbits the
          camera around the ring (see AgentCarousel3D/CameraRig); it
          doesn't spin the objects in place. */}
      <div className="relative mt-8 h-[26rem] w-full sm:h-[30rem]">
        {/* A "stage" behind the scene — without this the cube/cards just
            float on flat page background, which is what made the whole
            thing read as unfinished even with correct geometry. Same
            radial-glow idea the Hero uses behind its own cube, kept subtle
            via opacity rather than baking transparency into the gradient
            stops themselves. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 opacity-40 dark:opacity-25"
          style={{
            background:
              "radial-gradient(ellipse 65% 70% at 50% 50%, var(--aurora-highlight) 0%, var(--accent) 45%, transparent 75%)",
          }}
        />
        <AgentCarousel3D
          className="h-full w-full"
          agents={AGENTS}
          activeIndex={activeIndex}
          onActiveIndexChange={goTo}
          active={carouselVisible}
        />
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
