"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  easeInOut,
  type MotionValue,
} from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Building2, CalendarClock, PenLine, ShieldCheck, Send, BarChart3 } from "lucide-react";

const LiquidMetalOrb = dynamic(() => import("@/components/three/LiquidMetalOrb"), { ssr: false });

interface Beat {
  icon: LucideIcon;
  step: string;
  title: string;
  description: string;
}

const BEATS: Beat[] = [
  {
    icon: Building2,
    step: "01",
    title: "Entendemos tu negocio",
    description:
      "Un cuestionario corto y unas fotos bastan para que la IA aprenda tu marca — tono, público y servicios.",
  },
  {
    icon: CalendarClock,
    step: "02",
    title: "Planeamos cada día",
    description: "Decidimos qué publicar, en qué formato y a qué hora, respetando el presupuesto de tu plan.",
  },
  {
    icon: PenLine,
    step: "03",
    title: "Escribimos y creamos",
    description:
      "Cada guion suena como tu marca. Cada pieza se genera en imagen o video real, con audio y subtítulos si tu plan lo incluye.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Revisamos antes de publicar",
    description: "Si algo no calza con tu marca, se detiene para tu revisión — nunca se publica algo a medias.",
  },
  {
    icon: Send,
    step: "05",
    title: "Publicamos y respondemos",
    description:
      "Sale en el horario que mejor funciona, y respondemos preguntas de compra — precio, horario, disponibilidad.",
  },
  {
    icon: BarChart3,
    step: "06",
    title: "Medimos resultados",
    description: "Alcance y engagement, mes contra mes, traducidos a lenguaje de negocio.",
  },
];

// Orb drift, in small three.js world units — one control point per beat.
// Kept well inside the camera frustum (see LiquidMetalOrb's cameraDistance/fov
// for this instance) so the sphere never reaches the canvas's own edge.
const ORB_DRIFT = [
  { x: -0.26, y: -0.1, scale: 0.98 },
  { x: 0.28, y: 0.08, scale: 1.08 },
  { x: -0.16, y: 0.22, scale: 0.94 },
  { x: 0.22, y: -0.2, scale: 1.06 },
  { x: -0.28, y: 0.05, scale: 1.1 },
  { x: 0.12, y: 0.15, scale: 1 },
];

// Small blurred accents drifting at a different rate than the orb, for depth.
const PARTICLES = [
  { size: 14, opacity: 0.5, from: { x: -260, y: -160 }, to: { x: 220, y: 140 } },
  { size: 9, opacity: 0.4, from: { x: 240, y: -120 }, to: { x: -200, y: 180 } },
  { size: 11, opacity: 0.35, from: { x: -160, y: 200 }, to: { x: 180, y: -180 } },
];

/** Builds the [start,fadeIn,fadeOut,end] progress breakpoints for beat `index` of `total`. */
function beatInputRange(index: number, total: number, fadeFraction: number): number[] {
  const segment = 1 / total;
  const start = index * segment;
  const end = start + segment;
  const fade = segment * fadeFraction;
  if (index === 0) return [start, start, end - fade, end];
  if (index === total - 1) return [start, start + fade, end, end];
  return [start, start + fade, end - fade, end];
}

/** Builds the matching output values, holding at the edges for the first/last beat. */
function beatOutputRange<T>(index: number, total: number, enter: T, hold: T, exit: T): T[] {
  if (index === 0) return [hold, hold, hold, exit];
  if (index === total - 1) return [enter, hold, hold, hold];
  return [enter, hold, hold, exit];
}

function BeatContent({
  beat,
  progress,
  index,
  total,
}: {
  beat: Beat;
  progress: MotionValue<number>;
  index: number;
  total: number;
}) {
  const input = beatInputRange(index, total, 0.32);
  const opacity = useTransform(progress, input, beatOutputRange(index, total, 0, 1, 0), { ease: easeInOut });
  const y = useTransform(progress, input, beatOutputRange(index, total, 20, 0, -20), { ease: easeInOut });

  return (
    <motion.div
      style={{ opacity, y }}
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
    >
      <p className="mb-4 font-mono text-xs tracking-[0.3em] text-zinc-400">
        {beat.step} / {String(total).padStart(2, "0")}
      </p>
      <h3 className="chrome-text max-w-lg text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
        {beat.title}
      </h3>
      <p className="mt-5 max-w-md text-balance text-sm text-zinc-600 sm:text-base">{beat.description}</p>
    </motion.div>
  );
}

function ProgressDot({ progress, index, total }: { progress: MotionValue<number>; index: number; total: number }) {
  const input = beatInputRange(index, total, 0.15);
  const backgroundColor = useTransform(
    progress,
    input,
    beatOutputRange(index, total, "#d4d4d8", "#18181b", "#d4d4d8"),
    { ease: easeInOut },
  );
  return <motion.span className="h-1 w-6 rounded-full" style={{ backgroundColor }} />;
}

function Particle({
  progress,
  size,
  opacity,
  from,
  to,
}: {
  progress: MotionValue<number>;
  size: number;
  opacity: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}) {
  const xRaw = useTransform(progress, [0, 1], [from.x, to.x]);
  const yRaw = useTransform(progress, [0, 1], [from.y, to.y]);
  const x = useTransform(xRaw, (v) => `calc(-50% + ${v}px)`);
  const y = useTransform(yRaw, (v) => `calc(-50% + ${v}px)`);

  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 rounded-full blur-md"
      style={{
        width: size,
        height: size,
        opacity,
        background: "radial-gradient(circle, #ffffff 0%, #8b8d94 70%, transparent 100%)",
        x,
        y,
      }}
    />
  );
}

function StaticFallback() {
  return (
    <section id="agentes" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">EL CICLO DIARIO</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Así trabaja Praeko por tu marca, todos los días
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-2 lg:grid-cols-3">
          {BEATS.map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="flex flex-col gap-4 bg-[var(--background)] p-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.08)]">
                <Icon className="h-5 w-5 text-zinc-700" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Extra scroll room after the last beat, purely so the sticky panel can
// fade out (see `panelOpacity` below) before position:sticky runs out of
// room in its container and visibly gets squeezed against the bottom edge.
const CONTENT_VH_PER_BEAT = 85;
const RELEASE_BUFFER_VH = 60;

export default function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const contentVh = BEATS.length * CONTENT_VH_PER_BEAT;
  const contentFraction = contentVh / (contentVh + RELEASE_BUFFER_VH);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  // Rescale so beat 0..1 progress covers only the content portion — the
  // release buffer at the end is "dead" scroll space, not another beat.
  // No spring here: text needs to track the scrollbar exactly, or a fast
  // flick-scroll makes it look like the story is lagging behind the finger.
  // The orb reads this same MotionValue directly inside its own render loop
  // (see LiquidMetalOrb), so its drift stays in perfect sync with the text too.
  const progress = useTransform(scrollYProgress, [0, contentFraction], [0, 1], { clamp: true });
  // Fades the whole panel out during the release buffer, so it's already
  // invisible by the time the sticky container's edge would otherwise clip it.
  const panelOpacity = useTransform(scrollYProgress, [contentFraction, 1], [1, 0], { clamp: true });

  if (reducedMotion) {
    return <StaticFallback />;
  }

  return (
    <section
      id="agentes"
      ref={containerRef}
      className="relative"
      style={{ height: `${contentVh + RELEASE_BUFFER_VH}vh` }}
    >
      <motion.div
        style={{ opacity: panelOpacity }}
        className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden"
      >
        {/* Subtle ambient light bounce behind the orb — depth, not the main subject. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl sm:h-[50rem] sm:w-[50rem]"
          style={{
            background: "radial-gradient(circle, #ffffff 0%, #c8cad0 45%, transparent 75%)",
          }}
        />

        {PARTICLES.map((p, i) => (
          <Particle key={i} progress={progress} {...p} />
        ))}

        <LiquidMetalOrb
          className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 opacity-85 sm:h-[44rem] sm:w-[44rem]"
          progress={progress}
          driftPoints={ORB_DRIFT}
          fov={34}
          cameraDistance={6.4}
          cinematic
          edgeFade
        />

        <p className="pointer-events-none absolute top-24 text-xs font-semibold tracking-[0.3em] text-zinc-500">
          EL CICLO DIARIO
        </p>

        {BEATS.map((beat, i) => (
          <BeatContent key={beat.step} beat={beat} progress={progress} index={i} total={BEATS.length} />
        ))}

        <div className="pointer-events-none absolute bottom-12 flex gap-1.5">
          {BEATS.map((_, i) => (
            <ProgressDot key={i} progress={progress} index={i} total={BEATS.length} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
