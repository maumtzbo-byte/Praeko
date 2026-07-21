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
  // chunk and spin up a WebGL context on small screens even though nobody
  // could ever see it there. Gated at lg (not sm) now that the object plays
  // a much bigger, more dramatic role — at tablet widths there isn't room
  // for both it and the wide, left-aligned headline without collision.
  const [showObject, setShowObject] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
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
    <>
      {/* Impact hero — a full-bleed dramatic dark band with a huge,
          left-aligned headline (Shopify's structure specifically: a
          massive statement over a dark, cinematic backdrop, not a small
          centered stack in a card). Permanently dark regardless of the
          site's own light/dark toggle — like the featured Pro pricing
          card, this is a deliberate fixed-dark moment, not a themed
          surface, so none of its colors carry `dark:` variants. */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden bg-zinc-950 sm:min-h-[92vh]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 55% at 80% 42%, rgba(42,92,219,0.4) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 10% 90%, rgba(18,32,109,0.5) 0%, transparent 70%)",
          }}
        />

        {/* Praeko's own visual signature — a real, physically-rendered
            glass object, not a stock photo (which Praeko doesn't have) and
            not another gradient blob. Sized and cropped by the frame's own
            edge on purpose, echoing how the reference's photograph bleeds
            past the viewport — "bigger than the frame" reads as
            confidence, not an oversight. */}
        {showObject && (
          <div
            ref={objectWrapRef}
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 top-1/2 h-[32rem] w-[32rem] -translate-y-1/2 xl:-right-16 xl:h-[40rem] xl:w-[40rem]"
          >
            <GlassMobius className="h-full w-full" active={objectVisible} />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-7xl px-6 py-28 sm:px-10 md:py-32"
        >
          <div className="max-w-3xl">
            <span className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-medium tracking-[0.2em] text-zinc-300 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              MARKETING CON INTELIGENCIA
            </span>
            <h1 className="mt-7 text-balance font-sans text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
              Tu negocio puede <span className="aurora-text">crecer solo</span>
            </h1>
            <p className="mt-6 max-w-xl text-balance text-lg text-zinc-400 sm:text-xl">
              Videos, imágenes y carruseles nuevos cada día, listos para tus
              redes — sin que tú grabes, edites ni programes nada.
            </p>
            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/registro"
                className="btn-shine rounded-full bg-white px-8 py-4 text-base font-medium text-zinc-950 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_20px_50px_-15px_rgba(0,0,0,0.6)] transition-all hover:scale-[1.03]"
              >
                Empieza gratis
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

      {/* Product showcase — its own section, not crammed under the
          headline. The dashboard + phone composition from the earlier
          pass stays as-is: it's still "the product, large, early," just
          given room to breathe as a second beat instead of fighting the
          impact hero for the same viewport. */}
      <section className="relative overflow-hidden pb-20 pt-16 md:pb-28 md:pt-20">
        <AuroraBackground />

        <div className="relative mx-auto w-full max-w-6xl px-6">
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
              real phone so it reads as "this goes straight to Instagram." A
              real overlap onto the dashboard's own corner (not a small card
              peeking from outside the frame) is what makes this read as one
              layered composition — the two devices sharing space — instead
              of two separate rectangles that happen to sit near each other. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10, rotate: 4 }}
            whileInView={{ opacity: 1, scale: 1, y: 0, rotate: 4 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
            className="absolute -bottom-10 right-2 w-32 sm:-bottom-14 sm:right-4 sm:w-44 md:-bottom-16 md:right-8 md:w-56 lg:right-12 lg:w-64"
          >
            {/* Static entrance (opacity/scale/y/rotate) lives on the motion.div
                above; the perpetual float bob (.card-float) lives on this
                plain child — both set `transform`, so on one element the CSS
                keyframe would silently overwrite the entrance values every
                frame once it starts looping. */}
            <div className="card-float-offset card-float">
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
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
