"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Play, Heart, MessageCircle, Send } from "lucide-react";
import AuroraBackground from "./AuroraBackground";

// Client-only — WebGL/Canvas has no server-side representation, and this
// is purely decorative, so it's excluded from the server bundle and from
// the initial paint entirely rather than adding to either.
const GlassMobius = dynamic(() => import("@/components/three/GlassMobius"), { ssr: false });

export default function Hero() {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const objectWrapRef = useRef<HTMLDivElement | null>(null);
  // Only renders frames while the object is actually on screen — scrolled
  // past the Hero, the WebGL context sits idle instead of spending GPU/
  // battery on a scene nobody can see.
  const [objectVisible, setObjectVisible] = useState(false);
  // Starts false (matches SSR, avoiding a hydration mismatch) and is only
  // ever flipped true client-side. This is deliberately a mount condition,
  // not just a CSS `hidden` class — a `display:none` div still mounts its
  // React children, which would still pull in the ~850KB three.js/r3f/drei
  // chunk and spin up a WebGL context on mobile even though nobody could
  // ever see it there.
  const [showObject, setShowObject] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 640px)");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount read of a client-only API (matchMedia), not derivable during render.
    setShowObject(mql.matches);
    const handler = (e: MediaQueryListEvent) => setShowObject(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!showObject) return;
    const el = objectWrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setObjectVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setObjectVisible(entry.isIntersecting), {
      threshold: 0.05,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [showObject]);
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
    <section className="relative flex flex-col items-center overflow-hidden pb-20 pt-28 md:pb-28 md:pt-36">
      <AuroraBackground />

      {/* Praeko's own visual signature — a real, physically-rendered glass
          object (not a CSS illusion), not another floating gradient blob or
          particle field. A Möbius strip specifically: one continuous,
          seamless surface, echoing the product's own loop (one input,
          endless output). Not mounted at all below sm (see `showObject`) —
          a second WebGL context plus its ~850KB three.js/r3f/drei chunk is
          a real cost not worth paying on small screens where it'd also
          just get cropped by the text stacking above it. */}
      {showObject && (
        <div
          ref={objectWrapRef}
          aria-hidden="true"
          className="pointer-events-none absolute right-[8%] top-16 h-[22rem] w-[22rem] md:right-[14%] md:h-[26rem] md:w-[26rem]"
        >
          <GlassMobius className="h-full w-full" active={objectVisible} />
        </div>
      )}

      {/* Real value proposition first — what Praeko does, in plain words —
          instead of the abstract "CREAMOS / IMPULSAMOS" pair that used to
          flank the orb. Those read as decorative brand copy, not
          information: a first-time visitor couldn't tell from them what
          Praeko actually is or does. */}
      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center"
      >
        <span className="flex items-center gap-2 rounded-full border border-zinc-300/80 bg-white/40 px-4 py-1.5 text-[11px] font-medium tracking-[0.2em] text-zinc-600 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          MARKETING CON INTELIGENCIA
        </span>
        <h1 className="text-balance font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl dark:text-white">
          {/* The one moving-gradient moment in the Hero — same shimmer used on
              the marketing site's other big headlines (CtaSection,
              PricingSection) — so the page reads as Praeko's signature
              aurora identity again, not just a generic product shot. */}
          <span className="aurora-text">Agentes de IA</span> que crean y publican el contenido de tu negocio
        </h1>
        <p className="max-w-lg text-balance text-zinc-600 sm:text-lg dark:text-zinc-400">
          Videos, imágenes y carruseles nuevos cada día, listos para tus
          redes — sin que tú grabes, edites ni programes nada.
        </p>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/registro"
            className="btn-shine rounded-full bg-zinc-950 px-7 py-3 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] transition-all hover:scale-[1.03] hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_0_0_4px_rgba(31,157,117,0.18)] dark:bg-white dark:text-zinc-950"
          >
            Empieza gratis
          </Link>
          <a
            href="#agentes"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            Cómo funciona →
          </a>
        </div>
      </motion.div>

      {/* The product itself, not an abstract 3D shape — a real screenshot
          of the Praeko dashboard (calendario, sample data), captured from
          the actual running app. Framed like a floating browser window
          with a soft backlight and a subtle cursor-tracked tilt, plus a
          second real screenshot (a single generated-content card) peeking
          from the corner for depth — same idea premium SaaS sites use to
          make a flat screenshot read as an object in space. */}
      <div className="relative mx-auto mt-16 w-full max-w-5xl px-6 md:mt-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 -top-10 bottom-0 -z-10 rounded-[50%] opacity-50 blur-3xl"
          style={{ background: "radial-gradient(ellipse at center, #c9daf9 0%, #4a7fe8 40%, transparent 72%)" }}
        />

        <motion.div
          ref={frameRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX: springRotateX, rotateY: springRotateY, transformPerspective: 1400 }}
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-[var(--hairline)] bg-white shadow-[0_50px_120px_-40px_rgba(0,0,0,0.4)] md:rounded-3xl dark:shadow-[0_50px_120px_-40px_rgba(0,0,0,0.8)]"
        >
          <div className="flex items-center gap-1.5 border-b border-[var(--hairline)] bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="ml-3 rounded-full border border-[var(--hairline)] bg-white px-3 py-1 text-[11px] text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
              app.praeko.com/calendario
            </span>
          </div>
          {/* The screenshot itself is always the light-mode dashboard (it's a
              real capture, not themeable) — a thin border already separates
              it from the page, and premium sites do this too (a product
              shot doesn't need to re-render per theme). */}
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
            real phone so it reads as "this goes straight to Instagram,"
            floating beside the calendar for the layered-cards depth premium
            SaaS sites use. A static rotate on this wrapper (not the
            calendar) is what sells "scattered, alive" instead of "two
            rectangles stacked neatly." */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10, rotate: 5 }}
          whileInView={{ opacity: 1, scale: 1, y: 0, rotate: 5 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
          className="absolute -bottom-6 -right-2 w-24 sm:-bottom-10 sm:w-36 md:-right-10 md:w-44"
        >
          {/* Static entrance (opacity/scale/y/rotate) lives on the motion.div
              above; the perpetual float bob (.card-float) lives on this
              plain child — both set `transform`, so on one element the CSS
              keyframe would silently overwrite the entrance values every
              frame once it starts looping. */}
          <div className="card-float-offset card-float">
            <div
              className="relative overflow-hidden rounded-[1.75rem] border-[5px] border-zinc-900 bg-zinc-900 shadow-[0_30px_70px_-20px_rgba(0,0,0,0.45)]"
              style={{ aspectRatio: "9 / 19.5" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent-strong via-zinc-900 to-zinc-950" />
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-1.5 h-3 w-12 -translate-x-1/2 rounded-full bg-black/40"
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                  <Play className="h-3.5 w-3.5 fill-white text-white" />
                </span>
              </span>
              <div className="absolute bottom-14 right-1.5 flex flex-col items-center gap-2.5 text-white">
                <Heart className="h-3.5 w-3.5 fill-white" />
                <MessageCircle className="h-3.5 w-3.5 fill-white" />
                <Send className="h-3.5 w-3.5 fill-white" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2.5 pt-6">
                <p className="text-[8px] font-semibold text-white">@tunegocio</p>
                <p className="mt-0.5 text-[7px] leading-tight text-white/80">Nuevo: Frappé de temporada 🧊</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
