"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Play, Heart, MessageCircle, Send, ArrowRight } from "lucide-react";

// The one phrase that rotates under "Tu negocio puede" — same pattern as
// Shopify's own hero (a fixed lead-in, a swapping payoff), each option a
// different angle on the same core promise so any one of them stands on
// its own as a headline.
const ROTATING_PHRASES = [
  "crecer solo",
  "venderse solo",
  "publicarse solo",
  "crecer sin ti",
  "crecer mientras duermes",
];
const ROTATE_INTERVAL_MS = 2600;

function RotatingHeadlineWord() {
  const [index, setIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount read of a client-only API (matchMedia), not derivable during render.
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % ROTATING_PHRASES.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const phrase = ROTATING_PHRASES[reducedMotion ? 0 : index];

  return (
    // Plain CSS keyframe (.rotate-word-in in globals.css), not framer-motion
    // — a JS-driven tween here proved flaky (opacity getting stuck
    // mid-transition independent of the transform in testing). The old
    // instance is simply gone the instant the key changes (no exit
    // animation to coordinate), and the overflow-hidden clip hides the cut.
    <span className="relative block h-[1.05em] w-full overflow-hidden">
      <span key={phrase} className={`absolute inset-0 ${reducedMotion ? "" : "rotate-word-in"}`}>
        <span className="text-accent">{phrase}</span>
      </span>
    </span>
  );
}

export default function Hero() {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 26 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 26 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 6);
    rotateX.set(-py * 6);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <>
      {/* Impact hero — a full-bleed dark band led entirely by typography:
          no floating 3D object, no glow, no gradient wash. A barely-visible
          1px grid is the only texture — the same "precision instrument"
          backdrop Linear/Vercel use instead of a decorative blob. */}
      <section className="relative flex min-h-[76vh] items-center overflow-hidden bg-zinc-950 sm:min-h-[80vh]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 0%, transparent 75%)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-7xl px-6 py-28 sm:px-10 md:py-32"
        >
          <div className="max-w-4xl">
            <h1 className="text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl">
              Tu negocio puede
              <RotatingHeadlineWord />
            </h1>
            <p className="mt-8 max-w-xl text-balance text-lg text-zinc-400 sm:text-xl">
              Contenido nuevo cada mañana. Tú solo publicas.
            </p>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/registro"
                className="group inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-[15px] font-medium tracking-tight text-zinc-950 transition-opacity hover:opacity-90"
              >
                Empieza gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#agentes"
                className="text-sm font-medium text-zinc-300 underline decoration-zinc-600 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
              >
                Cómo funciona →
              </a>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Product showcase — the dashboard + phone composition is the only
          visual in the whole hero now. No blob glow behind it; the frame
          and its hairline border carry the section on their own. */}
      <section className="relative overflow-hidden pb-20 pt-16 md:pb-28 md:pt-20">
        <div className="relative mx-auto w-full max-w-6xl px-6">
          <motion.div
            ref={frameRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 1400 }}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden rounded-2xl border border-[var(--hairline)] bg-white shadow-[0_40px_100px_-40px_rgba(0,0,0,0.35)] md:rounded-3xl dark:shadow-[0_40px_100px_-40px_rgba(0,0,0,0.7)]"
          >
            <div className="flex items-center gap-1.5 border-b border-[var(--hairline)] bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
              <span className="ml-3 rounded-full border border-[var(--hairline)] bg-white px-3 py-1 text-[11px] text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                app.praeko.com/calendario
              </span>
            </div>
            {/* The screenshot itself is always the light-mode dashboard
                (it's a real capture, not themeable) — a thin border already
                separates it from the page, and premium sites do this too
                (a product shot doesn't need to re-render per theme). */}
            <Image
              src="/screenshots/calendario-preview.png"
              alt="Calendario de contenido de Praeko con piezas generadas por IA, organizadas por fecha"
              width={2372}
              height={1320}
              className="h-auto w-full"
              priority
            />
          </motion.div>

          {/* The second half of the "wow" — not another screenshot of the
              tool, but the actual output: a Reel it published, framed as a
              real phone so it reads as "this goes straight to Instagram."
              A static tilt, no continuous bob — a precise, held pose reads
              closer to this direction than a perpetually floating card. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10, rotate: 4 }}
            whileInView={{ opacity: 1, scale: 1, y: 0, rotate: 4 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            className="absolute -bottom-10 right-2 w-32 sm:-bottom-14 sm:right-4 sm:w-44 md:-bottom-16 md:right-8 md:w-56 lg:right-12 lg:w-64"
          >
            <div
              className="relative overflow-hidden rounded-[2rem] border-[6px] border-zinc-900 bg-zinc-900 shadow-[0_40px_90px_-25px_rgba(0,0,0,0.55)] md:rounded-[2.5rem] md:border-[8px]"
              style={{ aspectRatio: "9 / 19.5" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-strong via-zinc-900 to-zinc-950" />
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1.5 h-3 w-12 -translate-x-1/2 rounded-full bg-black/40 md:top-2 md:h-4 md:w-16"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm md:h-12 md:w-12">
                  <Play className="h-3.5 w-3.5 fill-white text-white md:h-5 md:w-5" />
                </span>
              </span>
              <div className="absolute bottom-14 right-1.5 flex flex-col items-center gap-2.5 text-white md:bottom-20 md:right-3 md:gap-4">
                <Heart className="h-3.5 w-3.5 fill-white md:h-5 md:w-5" />
                <MessageCircle className="h-3.5 w-3.5 fill-white md:h-5 md:w-5" />
                <Send className="h-3.5 w-3.5 fill-white md:h-5 md:w-5" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2.5 pt-6 md:px-4 md:pb-4">
                <p className="text-[8px] font-semibold text-white md:text-xs">@tunegocio</p>
                <p className="mt-0.5 text-[7px] leading-tight text-white/80 md:text-[10px]">Nuevo: Frappé de temporada 🧊</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
