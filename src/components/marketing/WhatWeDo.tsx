"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ChevronLeft, ChevronRight, Compass, Wand2, Send, MessageCircle, BarChart3, type LucideIcon } from "lucide-react";

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

/** One floating card — a continuous idle bob (.card-float, phase-offset per
 * card like the review cards) plus a cursor-driven tilt on top of it,
 * reusing the same rotateX/rotateY-spring recipe as the pricing cards'
 * hover pop. Two different "3D" cues stacked (bob + tilt) is what makes
 * these read as physically floating rather than just a hover effect. */
function AgentCard({ agent, index }: { agent: (typeof AGENTS)[number]; index: number }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 300, damping: 28 });
  const springRotateY = useSpring(rotateY, { stiffness: 300, damping: 28 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 10);
    rotateX.set(-py * 10);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  const Icon = agent.icon;
  const floatClass = index % 2 === 0 ? "card-float" : "card-float card-float-offset";

  return (
    <div className={`w-[78%] shrink-0 snap-center sm:w-[300px] ${floatClass}`}>
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 900 }}
        className="relative flex h-full flex-col gap-4 rounded-3xl border border-[var(--hairline)] bg-white p-7 shadow-[0_2px_4px_rgba(0,0,0,0.06),0_28px_50px_-24px_rgba(0,0,0,0.4)] dark:bg-zinc-900 dark:shadow-[0_2px_4px_rgba(0,0,0,0.3),0_28px_50px_-24px_rgba(0,0,0,0.75)]"
      >
        <span className="text-xs font-semibold tracking-[0.25em] text-zinc-400 dark:text-zinc-600">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </span>
        <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">{agent.title}</h3>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{agent.description}</p>
      </motion.div>
    </div>
  );
}

export default function WhatWeDo() {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function scrollByCard(direction: 1 | -1) {
    scrollRef.current?.scrollBy({ left: direction * 328, behavior: "smooth" });
  }

  return (
    <section id="agentes" className="relative py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500 dark:text-zinc-400">QUÉ HACEMOS</p>
            <h2 className="max-w-md text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
              Cinco agentes, un negocio que se publica solo
            </h2>
          </div>
          {/* Desktop-only nav — mobile already gets a native, more direct
              swipe via the snap-scroll track itself. */}
          <div className="hidden shrink-0 gap-2 sm:flex">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              aria-label="Agente anterior"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline)] text-zinc-500 transition-colors hover:border-accent hover:text-accent dark:text-zinc-400"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              aria-label="Siguiente agente"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline)] text-zinc-500 transition-colors hover:border-accent hover:text-accent dark:text-zinc-400"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-6 py-4 [scrollbar-width:none] sm:mx-auto sm:max-w-6xl [&::-webkit-scrollbar]:hidden"
      >
        {AGENTS.map((agent, i) => (
          <AgentCard key={agent.title} agent={agent} index={i} />
        ))}
        {/* Trailing spacer so the last card can snap fully into view past
            the container's own right padding on mobile. */}
        <div aria-hidden="true" className="w-px shrink-0 sm:hidden" />
      </div>
    </section>
  );
}
