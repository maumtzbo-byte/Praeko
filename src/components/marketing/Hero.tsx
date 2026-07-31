"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Play, Heart, MessageCircle, Send } from "lucide-react";

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
    <span className="relative block h-[1.05em] w-full overflow-hidden">
      <span key={phrase} className={`absolute inset-0 ${reducedMotion ? "" : "rotate-word-in"}`}>
        {phrase}
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
      {/* Full-bleed sky-blue atmosphere (a gradient, not a stock photo of a
          person — Praeko has no real spokesperson to photograph) — same
          blue family sampled from the reference, fading down into the
          page's own off-white background so the phone mockup below reads
          as sitting right at that seam. */}
      <section
        className="relative flex min-h-[92vh] flex-col items-center overflow-hidden pb-0 pt-36 sm:min-h-[100vh] sm:pt-40"
        style={{
          background:
            "linear-gradient(180deg, #cfe6f8 0%, #7fb1dd 26%, #3d75ad 50%, #cfe0ef 82%, var(--background) 100%)",
        }}
      >
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-zinc-950/70 py-1.5 pl-1.5 pr-3.5 text-xs font-medium text-white backdrop-blur-sm">
            <span className="rounded-full bg-white/25 px-2 py-1 text-[10px] font-semibold">Nuevo</span>
            Agentes de IA para negocios en México
          </span>

          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
            Tu negocio puede
            <RotatingHeadlineWord />
          </h1>
          <p className="mt-6 max-w-xl text-balance text-lg text-white/90 sm:text-xl">Contenido nuevo cada mañana. Tú solo publicas.</p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/registro"
              className="rounded-full bg-white px-7 py-3.5 text-[15px] font-medium tracking-tight text-zinc-950 transition-opacity hover:opacity-90"
            >
              Empieza gratis
            </Link>
            <a
              href="#agentes"
              className="rounded-full bg-zinc-950/30 px-7 py-3.5 text-[15px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-zinc-950/45"
            >
              Cómo funciona
            </a>
          </div>
        </div>

        {/* Phone mockup overlapping the seam between the hero and the page
            below — the actual output (a published Reel), not another
            screenshot of the tool, doing the same "wow" job the
            reference's phone-over-photo composition does. */}
        <div className="relative z-10 mb-[-4.5rem] mt-12 w-40 shrink-0 sm:w-48 md:mb-[-5.5rem] md:w-56">
          <div
            className="relative overflow-hidden rounded-[2rem] border-[6px] border-zinc-900 bg-zinc-900 shadow-[0_40px_90px_-25px_rgba(0,0,0,0.45)] md:rounded-[2.5rem] md:border-[8px]"
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
      </section>

      {/* Product showcase — the dashboard screenshot, given room to breathe
          below the hero once the phone mockup above has already made the
          "wow" impression. */}
      <section className="relative overflow-hidden pb-20 pt-24 md:pb-28 md:pt-28">
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
            <Image
              src="/screenshots/calendario-preview.png"
              alt="Calendario de contenido de Praeko con piezas generadas por IA, organizadas por fecha"
              width={2372}
              height={1320}
              className="h-auto w-full"
              priority
            />
          </motion.div>
        </div>
      </section>
    </>
  );
}
