"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import LiquidMetalBackground from "./LiquidMetalBackground";

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
    <section className="relative flex flex-col items-center overflow-hidden pb-20 pt-28 md:pb-28 md:pt-36">
      <LiquidMetalBackground />

      {/* Real value proposition first — what Praeko does, in plain words —
          instead of the abstract "CREAMOS / IMPULSAMOS" pair that used to
          flank the orb. Those read as decorative brand copy, not
          information: a first-time visitor couldn't tell from them what
          Praeko actually is or does. */}
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 text-center">
        <span className="flex items-center gap-2 rounded-full border border-zinc-300/80 bg-white/40 px-4 py-1.5 text-[11px] font-medium tracking-[0.2em] text-zinc-600 backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
          </span>
          MARKETING CON INTELIGENCIA
        </span>
        <h1 className="text-balance font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl md:text-6xl">
          {/* The one moving-chrome moment in the Hero — same shimmer used on
              the marketing site's other big headlines (CtaSection,
              PricingSection) — so the page reads as Praeko's signature
              liquid-metal identity again, not just a generic product shot. */}
          <span className="chrome-text">Agentes de IA</span> que crean y publican el contenido de tu negocio
        </h1>
        <p className="max-w-lg text-balance text-zinc-600 sm:text-lg">
          Videos, imágenes y carruseles listos para tus redes, todos los días
          — sin que grabes, edites ni programes nada.
        </p>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/registro"
            className="rounded-full bg-zinc-950 px-7 py-3 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] transition-all hover:scale-[1.03] hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_0_0_4px_rgba(224,122,53,0.18)]"
          >
            Empieza gratis
          </Link>
          <a
            href="#agentes"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950"
          >
            Cómo funciona →
          </a>
        </div>
      </div>

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
          style={{ background: "radial-gradient(ellipse at center, #ffffff 0%, #c8cad0 40%, transparent 72%)" }}
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
          className="relative overflow-hidden rounded-2xl border border-[var(--hairline)] bg-white shadow-[0_50px_120px_-40px_rgba(0,0,0,0.4)] md:rounded-3xl"
        >
          <div className="flex items-center gap-1.5 border-b border-[var(--hairline)] bg-zinc-50 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
            <span className="ml-3 rounded-full border border-[var(--hairline)] bg-white px-3 py-1 text-[11px] text-zinc-400">
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

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
          className="absolute -bottom-8 -right-2 hidden w-56 sm:block md:-right-8 md:w-64"
        >
          {/* Static entrance (opacity/scale/y) lives on the motion.div
              above; the perpetual float bob (.card-float) lives on this
              plain child — both set `transform`, so on one element the CSS
              keyframe would silently overwrite the entrance values every
              frame once it starts looping. */}
          <div className="card-float">
            <div className="overflow-hidden rounded-xl border border-[var(--hairline)] bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)]">
              <Image
                src="/screenshots/content-card-preview.png"
                alt="Pieza de contenido generada por IA, lista para publicar"
                width={716}
                height={428}
                className="h-auto w-full"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
