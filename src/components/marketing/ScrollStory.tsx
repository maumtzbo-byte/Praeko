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

const StoryScene = dynamic(() => import("./story-scene"), { ssr: false });

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

function BeatCaption({
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
  const y = useTransform(progress, input, beatOutputRange(index, total, 14, 0, -10), { ease: easeInOut });

  return (
    <motion.div
      style={{ opacity, y }}
      className="pointer-events-none absolute inset-x-0 top-36 flex flex-col items-center px-6 text-center sm:top-40"
    >
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[6rem] font-bold leading-none text-zinc-950 opacity-[0.05] sm:text-[8rem]"
        >
          {beat.step}
        </span>
        <h3 className="chrome-text relative max-w-md text-balance text-2xl font-semibold tracking-tight sm:text-4xl">
          {beat.title}
        </h3>
        <p className="relative mt-3 max-w-sm text-balance text-sm text-zinc-600 sm:text-base">{beat.description}</p>
      </div>
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

/** A brief, translucent metallic sweep across each beat boundary — a scene
 * cut, not a fade — kept as a DOM layer so it never mixes with the 3D
 * canvas's own alpha compositing. */
function BeatWipe({ progress, boundaryFraction }: { progress: MotionValue<number>; boundaryFraction: number }) {
  const halfWidth = 0.05;
  const input = [boundaryFraction - halfWidth, boundaryFraction, boundaryFraction + halfWidth];
  // Baseline shifted by -50% so the resting position stays centered on
  // `left-1/2` without needing a competing CSS translate utility.
  const x = useTransform(progress, input, ["-190%", "-50%", "90%"], { ease: easeInOut, clamp: true });
  const opacity = useTransform(progress, input, [0, 0.4, 0], { ease: easeInOut, clamp: true });

  return (
    <motion.div
      aria-hidden="true"
      style={{
        x,
        skewX: -12,
        opacity,
        background:
          "linear-gradient(100deg, transparent 0%, rgba(255,255,255,0.9) 38%, rgba(20,20,24,0.3) 50%, rgba(255,255,255,0.9) 62%, transparent 100%)",
      }}
      className="pointer-events-none absolute inset-y-[-15%] left-1/2 w-[36vw]"
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
  // No spring here: everything needs to track the scrollbar exactly, or a
  // fast flick-scroll makes the story look like it's lagging behind the
  // finger. The 3D camera reads this same MotionValue directly inside its
  // own render loop (see StoryScene), so it stays in perfect sync too.
  const progress = useTransform(scrollYProgress, [0, contentFraction], [0, 1], { clamp: true });
  // Fades the whole panel out during the release buffer, so it's already
  // invisible by the time the sticky container's edge would otherwise clip it.
  const panelOpacity = useTransform(scrollYProgress, [contentFraction, 1], [1, 0], { clamp: true });

  if (reducedMotion) {
    return <StaticFallback />;
  }

  const boundaries = Array.from({ length: BEATS.length - 1 }, (_, i) => (i + 1) / BEATS.length);

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
        <StoryScene progress={progress} />

        <p className="pointer-events-none absolute top-20 text-xs font-semibold tracking-[0.3em] text-zinc-500 sm:top-24">
          EL CICLO DIARIO
        </p>

        {BEATS.map((beat, i) => (
          <BeatCaption key={beat.step} beat={beat} progress={progress} index={i} total={BEATS.length} />
        ))}

        {boundaries.map((f, i) => (
          <BeatWipe key={i} progress={progress} boundaryFraction={f} />
        ))}

        <div className="pointer-events-none absolute bottom-12 flex gap-1.5">
          {BEATS.map((_, i) => (
            <ProgressDot key={i} progress={progress} index={i} total={BEATS.length} />
          ))}
        </div>

        {/* Cinematic framing — a whisper-soft corner darkening, not a mood killer. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(9,9,11,0.05) 100%)" }}
        />
      </motion.div>
    </section>
  );
}
