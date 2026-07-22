"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { Dumbbell, UtensilsCrossed, Sparkles, ShoppingBag, HeartPulse, Briefcase, type LucideIcon } from "lucide-react";

// Same industry taxonomy already used in SocialProof/onboarding — real
// verticals Praeko serves, not stock-photo landscapes/portraits that have
// nothing to do with the product.
const INDUSTRIES: { label: string; icon: LucideIcon }[] = [
  { label: "Gimnasio o estudio boutique", icon: Dumbbell },
  { label: "Restaurante o cafetería", icon: UtensilsCrossed },
  { label: "Belleza y estética", icon: Sparkles },
  { label: "Retail o tienda", icon: ShoppingBag },
  { label: "Salud y bienestar", icon: HeartPulse },
  { label: "Servicios profesionales", icon: Briefcase },
];

// Fixed (not random-at-runtime) scatter start points per card, so phase 1
// is stable across renders instead of reshuffling on every mount.
const SCATTER = [
  { x: -260, y: -150, rotate: -18 },
  { x: 250, y: -190, rotate: 22 },
  { x: -310, y: 130, rotate: 14 },
  { x: 290, y: 170, rotate: -24 },
  { x: -150, y: -270, rotate: 10 },
  { x: 170, y: 250, rotate: -12 },
];

const RING_RADIUS_X = 280;
const RING_RADIUS_Y = 190;
const ARC_SHIFT_DEG = 55;
const CARD_GRADIENTS = [
  "radial-gradient(120% 120% at 20% 15%, #1e6b4c 0%, #04140d 70%)",
  "radial-gradient(120% 120% at 80% 25%, #237a56 0%, #0a2e23 70%)",
  "radial-gradient(120% 120% at 50% 85%, #0a2e23 0%, #04140d 70%)",
  "radial-gradient(120% 120% at 25% 75%, #1e6b4c 0%, #0a2e23 70%)",
  "radial-gradient(120% 120% at 75% 20%, #14523b 0%, #04140d 70%)",
  "radial-gradient(120% 120% at 40% 40%, #1e6b4c 0%, #0a2e23 70%)",
];

function ringPoint(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(rad) * RING_RADIUS_X, y: Math.cos(rad) * RING_RADIUS_Y };
}

/** One card's whole journey — scattered and tumbled (phase 1) -> converging
 * toward center (phase 2) -> settled into its slot on the ring around the
 * central text (phase 3) -> the ring keeps turning and lifts as a group
 * (phase 4) — all driven off the same `scrollYProgress` so every card stays
 * in lockstep with how far the user has scrolled, not its own timer. */
function GalleryCard({
  industry,
  index,
  total,
  scrollYProgress,
}: {
  industry: (typeof INDUSTRIES)[number];
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
}) {
  const Icon = industry.icon;
  const scatter = SCATTER[index % SCATTER.length];
  const angleBase = (index / total) * 360;
  const ringNow = useMemo(() => ringPoint(angleBase), [angleBase]);
  const ringShifted = useMemo(() => ringPoint(angleBase + ARC_SHIFT_DEG), [angleBase]);

  // The ring (0.42) holds its exact position through 0.62 before the arc
  // shift starts — without a hold, "converging" flows straight into
  // "arcing away" and a normal-speed scroll never actually shows a formed
  // ring, just a blur of cards never settling anywhere.
  const stops = [0, 0.22, 0.42, 0.62, 1];
  const x = useTransform(scrollYProgress, stops, [scatter.x, scatter.x * 0.4, ringNow.x, ringNow.x, ringShifted.x]);
  const y = useTransform(scrollYProgress, stops, [scatter.y, scatter.y * 0.4, ringNow.y, ringNow.y, ringShifted.y - 70]);
  const rotate = useTransform(scrollYProgress, stops, [scatter.rotate, scatter.rotate * 0.3, 0, 0, (angleBase + ARC_SHIFT_DEG) * 0.06]);
  const scale = useTransform(scrollYProgress, stops, [0.55, 0.85, 1, 1, 0.92]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.22, 1], ["46%", "22px", "22px"]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 1], [0, 1, 1]);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 h-32 w-24 overflow-hidden shadow-[0_18px_40px_-16px_rgba(0,0,0,0.55)] sm:h-40 sm:w-32"
      style={{ x, y, rotate, scale, opacity, borderRadius, marginLeft: "-3rem", marginTop: "-4rem", willChange: "transform" }}
    >
      <div className="absolute inset-0" style={{ background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }} />
      <Icon aria-hidden="true" className="absolute -right-3 -top-3 h-16 w-16 text-[var(--aurora-highlight)] opacity-25" strokeWidth={1.25} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
        <p className="text-[11px] font-medium leading-tight text-white sm:text-xs">{industry.label}</p>
      </div>
    </motion.div>
  );
}

/** Mobile and reduced-motion both skip the pinned scroll-jack entirely — a
 * ~250vh sticky section that only resolves through drag-scrolling reads as
 * a bug on a phone (too much scroll distance for too little screen), and
 * reduced motion shouldn't have to sit through a purely decorative ring
 * formation at all. A plain static grid gets the same content across. */
function StaticIndustryGrid() {
  return (
    <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 px-6 sm:grid-cols-3">
      {INDUSTRIES.map((industry, i) => {
        const Icon = industry.icon;
        return (
          <motion.div
            key={industry.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
            className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-[0_12px_30px_-14px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0" style={{ background: CARD_GRADIENTS[i % CARD_GRADIENTS.length] }} />
            <Icon aria-hidden="true" className="absolute -right-3 -top-3 h-16 w-16 text-[var(--aurora-highlight)] opacity-25" strokeWidth={1.25} />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-xs font-medium leading-tight text-white">{industry.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

const SAFE_MATCH_MEDIA = "(prefers-reduced-motion: reduce)";
const MOBILE_MATCH_MEDIA = "(max-width: 767px)";

export default function IndustryScrollGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [simplified, setSimplified] = useState(false);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  useEffect(() => {
    const reducedMql = window.matchMedia(SAFE_MATCH_MEDIA);
    const mobileMql = window.matchMedia(MOBILE_MATCH_MEDIA);
    const update = () => setSimplified(reducedMql.matches || mobileMql.matches);
    update();
    reducedMql.addEventListener("change", update);
    mobileMql.addEventListener("change", update);
    return () => {
      reducedMql.removeEventListener("change", update);
      mobileMql.removeEventListener("change", update);
    };
  }, []);

  if (simplified) {
    return (
      <section className="relative overflow-hidden bg-zinc-950 py-24">
        <div className="mx-auto mb-12 max-w-2xl px-6 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">PARA QUIÉN ES ESTO</p>
          <h2 className="text-balance font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Contenido para cualquier tipo de negocio
          </h2>
        </div>
        <StaticIndustryGrid />
      </section>
    );
  }

  return (
    <section ref={containerRef} className="relative bg-zinc-950" style={{ height: "260vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }} />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">PARA QUIÉN ES ESTO</p>
          <h2 className="max-w-sm text-balance font-[family-name:var(--font-display)] text-2xl italic tracking-tight text-white sm:text-3xl">
            Contenido para cualquier tipo de negocio
          </h2>
          <p className="mt-4 text-xs font-semibold tracking-[0.3em] text-zinc-500">DESLIZA PARA EXPLORAR</p>
        </div>

        {INDUSTRIES.map((industry, i) => (
          <GalleryCard key={industry.label} industry={industry} index={i} total={INDUSTRIES.length} scrollYProgress={scrollYProgress} />
        ))}
      </div>
    </section>
  );
}
