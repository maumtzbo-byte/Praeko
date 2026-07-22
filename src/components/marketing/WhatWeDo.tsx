"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, Compass, Wand2, Send, MessageCircle, BarChart3, type LucideIcon } from "lucide-react";

const GlassCube = dynamic(() => import("@/components/three/GlassCube"), { ssr: false });

const AGENTS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Compass,
    title: "Agente de Estrategia",
    description: "Aprende el tono, los productos y el público de tu negocio, y arma el plan de contenido del mes.",
  },
  {
    icon: Wand2,
    title: "Agente Creativo",
    description: "Escribe el guion y genera cada video, imagen o carrusel — listo para publicar, no un borrador.",
  },
  {
    icon: Send,
    title: "Agente de Publicación",
    description: "Programa y publica cada pieza en el horario en que tu público realmente está activo.",
  },
  {
    icon: MessageCircle,
    title: "Agente de Respuestas",
    description: "Contesta precio, horario y disponibilidad en tus comentarios y mensajes directos.",
  },
  {
    icon: BarChart3,
    title: "Agente de Resultados",
    description: "Mide qué contenido funciona de verdad y lo traduce a números que puedes entender.",
  },
];

// One distinct orientation per agent — a deliberate "camera cut" to a new
// view of the cube as the active card changes, not a random spin. Y keeps
// climbing across the set so swiping forward always reads as continuing
// in the same direction; X varies per card so each view is genuinely
// different, not just "the same cube further around."
const CUBE_ROTATIONS = [
  { x: 0.5, y: 0.4 },
  { x: -0.35, y: 1.35 },
  { x: 0.65, y: 2.5 },
  { x: -0.5, y: 3.5 },
  { x: 0.3, y: 4.55 },
];

function AgentCard({ agent, index, registerRef }: { agent: (typeof AGENTS)[number]; index: number; registerRef: (index: number, el: HTMLDivElement | null) => void }) {
  const Icon = agent.icon;
  return (
    <div
      ref={(el) => registerRef(index, el)}
      data-index={index}
      className="w-[82%] shrink-0 snap-center sm:w-[420px]"
    >
      {/* Solid, opaque white — deliberately not glassy, so it fully blocks
          the cube behind it in its own bounds. The cube is only meant to
          show through above/below the card, poking out like the reference
          image, not bleeding through the card face itself. */}
      <div className="relative flex min-h-[280px] flex-col justify-end gap-4 rounded-3xl bg-white p-8 shadow-[0_2px_4px_rgba(0,0,0,0.06),0_32px_60px_-24px_rgba(0,0,0,0.35)] dark:bg-zinc-900 dark:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_32px_60px_-24px_rgba(0,0,0,0.7)]">
        <span className="absolute right-6 top-6 text-xs font-semibold tracking-[0.25em] text-zinc-300 dark:text-zinc-700">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <h3 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">{agent.title}</h3>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{agent.description}</p>
      </div>
    </div>
  );
}

export default function WhatWeDo() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cubeVisible, setCubeVisible] = useState(false);

  function registerCardRef(index: number, el: HTMLDivElement | null) {
    cardRefs.current[index] = el;
  }

  // Which card is centered in the swipe track drives the cube's target
  // rotation — this is the "swipe -> camera change" link, and it works
  // identically whether the swipe came from a touch drag, a trackpad, or
  // the prev/next buttons (which just scroll the same track).
  useEffect(() => {
    const track = scrollRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex: number | null = null;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = Number((entry.target as HTMLElement).dataset.index);
          }
        }
        if (bestIndex !== null && bestRatio > 0.5) setActiveIndex(bestIndex);
      },
      { root: track, threshold: [0, 0.25, 0.5, 0.75, 0.9, 1] },
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // A snap-scroll track doesn't auto-snap on load — without this, card 1
  // sits flush at the track's left edge instead of centered, which puts
  // it out of alignment with the cube (fixed at the track's horizontal
  // center) until the visitor's first swipe corrects it. Sets scrollLeft
  // directly (rather than scrollIntoView, which was inconsistent here,
  // likely fighting the track's own scroll-snap-type) inside a rAF so it
  // runs after layout has actually settled.
  useEffect(() => {
    const track = scrollRef.current;
    const card = cardRefs.current[0];
    if (!track || !card) return;
    const id = requestAnimationFrame(() => {
      track.scrollLeft = card.offsetLeft - (track.clientWidth - card.clientWidth) / 2;
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Pauses the WebGL frameloop once the section scrolls off-screen —
  // this cube is mounted on every screen size (the swipe interaction is
  // the point on mobile too, unlike the Hero's lg-only decorative one),
  // so keeping it from rendering while invisible actually matters here.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setCubeVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setCubeVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function scrollToIndex(index: number) {
    const clamped = Math.max(0, Math.min(AGENTS.length - 1, index));
    cardRefs.current[clamped]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
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
          </div>
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex - 1)}
              aria-label="Agente anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline)] text-zinc-500 transition-colors hover:border-accent hover:text-accent dark:text-zinc-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollToIndex(activeIndex + 1)}
              aria-label="Siguiente agente"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline)] text-zinc-500 transition-colors hover:border-accent hover:text-accent dark:text-zinc-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative mt-12">
        {/* One shared cube, not one per card — absolutely centered over
            the track so it stays put while cards scroll past underneath
            it, its top/bottom corners poking out above and below whichever
            card is currently centered (the card itself, being opaque,
            blocks the cube everywhere else). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 z-0 flex -translate-y-1/2 justify-center"
        >
          <GlassCube
            className="h-[22rem] w-[22rem] sm:h-[26rem] sm:w-[26rem]"
            active={cubeVisible}
            targetRotation={CUBE_ROTATIONS[activeIndex]}
          />
        </div>

        <div
          ref={scrollRef}
          className="relative z-10 flex snap-x snap-mandatory gap-5 overflow-x-auto py-4 [scrollbar-width:none] sm:mx-auto sm:max-w-6xl [&::-webkit-scrollbar]:hidden"
        >
          {/* Leading/trailing spacers, sized to half the gap between a card
              and the track's own width — without these, there's no room to
              scroll card 1 (or the last card) into a truly centered
              position, so the browser just clamps scrollLeft back to 0/max
              and they're stuck flush against the edge instead. */}
          <div aria-hidden="true" className="w-[9%] shrink-0 sm:w-[calc(50%-210px)]" />
          {AGENTS.map((agent, i) => (
            <AgentCard key={agent.title} agent={agent} index={i} registerRef={registerCardRef} />
          ))}
          <div aria-hidden="true" className="w-[9%] shrink-0 sm:w-[calc(50%-210px)]" />
        </div>
      </div>

      {/* Progress dots — a lighter-weight "which one am I on" cue than
          the number badge alone, and doubles as direct navigation. */}
      <div className="mt-6 flex justify-center gap-2">
        {AGENTS.map((agent, i) => (
          <button
            key={agent.title}
            type="button"
            onClick={() => scrollToIndex(i)}
            aria-label={`Ir a ${agent.title}`}
            className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-6 bg-accent" : "w-1.5 bg-zinc-300 dark:bg-zinc-700"}`}
          />
        ))}
      </div>
    </section>
  );
}
