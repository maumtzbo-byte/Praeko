"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  motion,
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

/** Builds the [fadeIn, start, fadeOut, end] progress breakpoints for beat `index` of `total`.
 * The scroll quantizer (see useOneBeatPerGesture below) always rests exactly on a beat's own
 * `start` boundary (index/total) — so the fade-in has to complete *by* start, not begin there.
 * Beat i's own hold window therefore lives entirely inside [start, end], borrowing its entry
 * ramp from the tail end of beat i-1's window; that's also why beat 0 needs no entry ramp of
 * its own (there's no beat -1 to borrow room from) and holds from progress 0 immediately. */
function beatInputRange(index: number, total: number, fadeFraction: number): number[] {
  const segment = 1 / total;
  const start = index * segment;
  const end = start + segment;
  const fade = segment * fadeFraction;
  if (index === 0) return [start, start, end - fade, end];
  if (index === total - 1) return [start - fade, start, end, end];
  return [start - fade, start, end - fade, end];
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

/** A compact icon badge per beat — the whole 6-step pipeline stays visible
 * at a glance underneath the story, not just an abstract progress bar.
 * Reuses each beat's own icon (previously only shown in the reduced-motion
 * fallback), so it's one small addition rather than a whole new element. */
function ProgressDot({ beat, progress, index, total }: { beat: Beat; progress: MotionValue<number>; index: number; total: number }) {
  const input = beatInputRange(index, total, 0.15);
  const scale = useTransform(progress, input, beatOutputRange(index, total, 1, 1.15, 1), { ease: easeInOut });
  const opacity = useTransform(progress, input, beatOutputRange(index, total, 0.45, 1, 0.45), { ease: easeInOut });
  const Icon = beat.icon;
  return (
    <motion.div
      style={{ scale, opacity }}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] ring-1 ring-[var(--hairline)]"
    >
      <Icon className="h-3.5 w-3.5 text-zinc-700" strokeWidth={1.75} />
    </motion.div>
  );
}

/** Small blurred accents drifting slowly across the whole story, for depth —
 * like dust catching studio light. Keeps the space from reading as empty
 * during the long holds between beat transitions. */
const PARTICLES = [
  { size: 14, opacity: 0.45, from: { x: -320, y: -180 }, to: { x: 300, y: 160 } },
  { size: 9, opacity: 0.35, from: { x: 280, y: -140 }, to: { x: -260, y: 200 } },
  { size: 11, opacity: 0.3, from: { x: -200, y: 220 }, to: { x: 220, y: -200 } },
  { size: 7, opacity: 0.28, from: { x: 80, y: -280 }, to: { x: -140, y: 240 } },
  { size: 8, opacity: 0.25, from: { x: -360, y: 60 }, to: { x: 320, y: -80 } },
];

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
const ADVANCE_DURATION_MS = 650;
// A small buffer beyond the animation's own duration — without it, a new
// gesture's wall-clock cooldown check can clear a few milliseconds before
// the previous animation's own rAF loop gets its final tick (rAF timing
// and the cooldown's performance.now() check don't share a clock exactly),
// letting two animations briefly overlap.
const COOLDOWN_MS = ADVANCE_DURATION_MS + 60;

/** Turns every wheel/touch gesture inside the section into exactly one
 * beat-advance, no matter how large the gesture's delta is — CSS
 * scroll-snap alone doesn't guarantee this (tested: a single large wheel
 * delta can settle several snap points away instead of stopping at the
 * next one). Outside the section's range, native scrolling is untouched. */
function useOneBeatPerGesture(containerRef: React.RefObject<HTMLElement | null>, totalBeats: number, totalHeightVh: number, disabled: boolean) {
  useEffect(() => {
    if (disabled) return;
    const section = containerRef.current;
    if (!section) return;

    // Wall-clock cooldown, not tied to requestAnimationFrame completing —
    // on an irregular/slow frame rate (throttled tabs, low-end devices) a
    // rAF-driven "locked until animation finishes" flag can clear far
    // earlier or later than intended, letting a rapid burst of wheel events
    // sneak through. A plain timestamp comparison is immune to that.
    let lastAdvanceAt = 0;
    let rafId: number | null = null;
    let settleTimeoutId: number | null = null;
    let touchStartY: number | null = null;
    const MIN_SWIPE_PX = 24;
    const SETTLE_EPSILON_PX = 2;

    // Derived from the section's own measured height, not window.innerHeight —
    // the section's CSS height uses plain `vh` (static: fixed to the largest
    // viewport), but mobile Safari's window.innerHeight is dynamic and
    // shrinks/grows as its address bar and toolbar show or hide. Mixing the
    // two meant a beat's computed pixel position could drift away from where
    // the (static-vh-based) content actually sat, landing scroll animations
    // short/long of the real boundary — the mid-transition "stuck" cards.
    const sectionTop = () => section.getBoundingClientRect().top + window.scrollY;
    const totalHeightPx = () => section.getBoundingClientRect().height;
    // `progress` (the MotionValue driving both the camera rig and the
    // caption fades) comes from Framer's scrollYProgress, whose scroll
    // range is (sectionHeight - viewportHeight) — not sectionHeight itself,
    // since the sticky panel only scrolls through one viewport's worth less
    // than the section's total height. Sizing beatPx off the raw section
    // height alone (no viewport subtraction) made every quantized stop land
    // a fixed ~3-4% of a beat past its intended boundary — squarely inside
    // the camera/caption crossfade zone instead of the fully-held shot. That
    // put every card in a permanently half-transitioned state at rest,
    // regardless of how the gesture that got there behaved: on a narrow
    // viewport the mispositioned camera clips the panel out of frame; on a
    // wide viewport the same offset is present but less visually obvious.
    // This is why "stuck" reproduced deterministically, not just after
    // strong scrolls.
    const beatPx = () => ((totalHeightPx() - window.innerHeight) * CONTENT_VH_PER_BEAT) / totalHeightVh;
    const isInsideSection = () => {
      const rect = section.getBoundingClientRect();
      return rect.top <= 0 && rect.bottom > 0;
    };
    // A mistrusted measurement (e.g. a mobile browser mid-animation on its
    // own address bar, momentarily reporting a section height at or below
    // the viewport height) used to still get hijacked: bPx could come out
    // as ~0, NaN, or negative, and every gesture from then on computed a
    // target equal to wherever the page already was — silently swallowed
    // by preventDefault below with zero visible movement, in *both*
    // directions, which reads as "scroll is completely stuck". Bailing out
    // here instead lets the browser's native scroll handle that gesture,
    // so the worst case is one un-hijacked gesture, never a dead end.
    const canHijack = () => {
      const bPx = beatPx();
      return Number.isFinite(bPx) && bPx > 1;
    };
    const isCoolingDown = () => performance.now() - lastAdvanceAt < COOLDOWN_MS;

    // Absolute guarantee, independent of *why* something might nudge the
    // page after the animation finishes (iOS Safari's native momentum
    // scroll in particular isn't always fully stoppable via preventDefault
    // once a swipe gesture has already started — touch-action: none on the
    // section is the primary fix for that, this is the backstop). Re-checks
    // the resting position twice after the animation completes and snaps it
    // back onto the exact target if anything moved it off — so the card can
    // never end up sitting between two beats, regardless of the cause.
    function scheduleSettleCheck(targetY: number) {
      if (settleTimeoutId !== null) {
        clearTimeout(settleTimeoutId);
        settleTimeoutId = null;
      }
      let checksLeft = 2;
      function check() {
        if (Math.abs(window.scrollY - targetY) > SETTLE_EPSILON_PX) {
          window.scrollTo(0, targetY);
        }
        checksLeft--;
        settleTimeoutId = checksLeft > 0 ? window.setTimeout(check, 200) : null;
      }
      settleTimeoutId = window.setTimeout(check, 180);
    }

    function animateTo(targetY: number) {
      // Cancel any animation still in flight first — without this, a new
      // gesture starting while the previous one's last frame hasn't fired
      // yet leaves two rAF loops writing scroll position on alternating
      // frames, which is exactly what left the card stuck mid-transition.
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // Also cancel any pending settle-check from a previous gesture — it
      // would otherwise fire mid-way through this new animation and snap
      // the page back to the *previous* target instead of this one.
      if (settleTimeoutId !== null) {
        clearTimeout(settleTimeoutId);
        settleTimeoutId = null;
      }
      const startY = window.scrollY;
      const delta = targetY - startY;
      if (Math.abs(delta) < 1) return false;
      const startTime = performance.now();
      function tick(now: number) {
        const t = Math.min((now - startTime) / ADVANCE_DURATION_MS, 1);
        window.scrollTo(0, startY + delta * easeInOut(t));
        if (t < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          rafId = null;
          scheduleSettleCheck(targetY);
        }
      }
      rafId = requestAnimationFrame(tick);
      return true;
    }

    // Returns true if the gesture actually moved the page (i.e. should be
    // prevented from also triggering native scroll). Returning false — for
    // untrustworthy geometry, or a target that's already where the page is
    // — leaves the gesture's default behavior alone instead of swallowing
    // it with nothing to show for it.
    function handleGesture(direction: 1 | -1): boolean {
      if (!canHijack()) return false;
      const top = sectionTop();
      const bPx = beatPx();
      const currentStop = Math.round((window.scrollY - top) / bPx);
      const clamped = Math.min(Math.max(currentStop, 0), totalBeats);
      let targetY: number;
      if (clamped <= 0 && direction < 0) {
        // Exit upward into Hero. Used to just return false here and let
        // native scrolling carry the gesture the rest of the way — but
        // touch-action: none (needed elsewhere to stop iOS's momentum
        // scroll from fighting the quantizer) blocks ALL native touch
        // scrolling inside the section, including this hand-off. A swipe
        // at the very first beat did nothing as a result. Drive the exit
        // ourselves instead of relying on a pass-through that no longer
        // exists once outside content is reached.
        targetY = top - bPx;
      } else if (clamped >= totalBeats && direction > 0) {
        // Exit downward into Pricing — same reasoning: land exactly on the
        // section's bottom edge, where isInsideSection() naturally goes
        // false and native scrolling takes back over from there.
        targetY = top + totalHeightPx();
      } else {
        targetY = Math.max(top, Math.min(top + (clamped + direction) * bPx, top + totalHeightPx()));
      }
      const moved = animateTo(targetY);
      if (moved) lastAdvanceAt = performance.now();
      return moved;
    }

    function onWheel(e: WheelEvent) {
      if (!isInsideSection()) return;
      if (isCoolingDown()) {
        if (canHijack()) e.preventDefault();
        return;
      }
      if (handleGesture(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
    }

    function onTouchStart(e: TouchEvent) {
      touchStartY = isInsideSection() && canHijack() ? (e.touches[0]?.clientY ?? null) : null;
    }
    function onTouchMove(e: TouchEvent) {
      if (touchStartY === null || !isInsideSection()) return;
      e.preventDefault();
    }
    function onTouchEnd(e: TouchEvent) {
      if (touchStartY === null) return;
      const endY = e.changedTouches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - endY;
      touchStartY = null;
      if (Math.abs(delta) < MIN_SWIPE_PX || isCoolingDown()) return;
      handleGesture(delta > 0 ? 1 : -1);
    }

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (settleTimeoutId !== null) clearTimeout(settleTimeoutId);
    };
  }, [containerRef, totalBeats, totalHeightVh, disabled]);
}

export default function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  // Starts false — same on server and client, so the first client render
  // matches the server-rendered markup exactly — and only switches to the
  // static fallback after mount, once matchMedia can actually be read.
  // framer-motion's own useReducedMotion() returns non-null during SSR in
  // a way that disagreed with its own first client render here, which was
  // producing a real hydration mismatch (server and client rendering two
  // different branches of the `if (reducedMotion)` below).
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount read of a client-only API (matchMedia), not derivable during render.
    if (reduced) setReducedMotion(true);
  }, []);
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
  useOneBeatPerGesture(containerRef, BEATS.length, contentVh + RELEASE_BUFFER_VH, reducedMotion);

  if (reducedMotion) {
    return <StaticFallback />;
  }

  return (
    <section
      id="agentes"
      ref={containerRef}
      className="relative touch-none"
      style={{ height: `${contentVh + RELEASE_BUFFER_VH}vh` }}
    >
      <motion.div
        style={{ opacity: panelOpacity }}
        className="sticky top-0 flex h-dvh items-center justify-center overflow-hidden"
      >
        {/* Ambient light bounce — keeps the space from reading as empty gray void. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl sm:h-[54rem] sm:w-[54rem]"
          style={{
            background: "radial-gradient(circle, #ffffff 0%, #c8cad0 45%, transparent 75%)",
          }}
        />

        {PARTICLES.map((p, i) => (
          <Particle key={i} progress={progress} {...p} />
        ))}

        {/* Hard safety margin, independent of camera/viewport math: no matter
            how a real device's viewport quirks shift the 3D framing, the
            scene can never visually reach the caption above or the icon
            row below — it just fades out first. Mobile reserves more of the
            frame since the caption text takes up proportionally more room
            on a small screen. */}
        <div className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent_0%,black_25%,black_86%,transparent_100%)] sm:[mask-image:linear-gradient(to_bottom,transparent_0%,black_15%,black_92%,transparent_100%)]">
          <StoryScene progress={progress} />
        </div>

        <p className="pointer-events-none absolute top-20 text-xs font-semibold tracking-[0.3em] text-zinc-500 sm:top-24">
          EL CICLO DIARIO
        </p>

        {BEATS.map((beat, i) => (
          <BeatCaption key={beat.step} beat={beat} progress={progress} index={i} total={BEATS.length} />
        ))}

        <div className="pointer-events-none absolute bottom-10 flex items-center gap-2.5">
          {/* Subtle connecting line — reads as one pipeline, not six loose dots. */}
          <div aria-hidden="true" className="absolute left-3.5 right-3.5 h-px bg-[var(--hairline)]" />
          {BEATS.map((beat, i) => (
            <ProgressDot key={i} beat={beat} progress={progress} index={i} total={BEATS.length} />
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
