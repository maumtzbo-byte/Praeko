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

// The reference is a dense wreath — 14-16 overlapping cards packed edge to
// edge in a full circle, not 6 sparse ones with gaps between them. Praeko
// only has 6 real verticals, so the ring cycles through them repeatedly to
// get the density right; repetition here is decorative pattern-filling,
// not the "don't invent content" rule the placeholder copy elsewhere in
// the site is about.
const RING_COUNT = 14;
const RING_ITEMS = Array.from({ length: RING_COUNT }, (_, i) => ({ id: i, ...INDUSTRIES[i % INDUSTRIES.length] }));

const RING_RADIUS = 220;
const ARC_SHIFT_DEG = 40;
const CARD_GRADIENTS = [
  "radial-gradient(120% 120% at 20% 15%, #1e6b4c 0%, #04140d 70%)",
  "radial-gradient(120% 120% at 80% 25%, #237a56 0%, #0a2e23 70%)",
  "radial-gradient(120% 120% at 50% 85%, #0a2e23 0%, #04140d 70%)",
  "radial-gradient(120% 120% at 25% 75%, #1e6b4c 0%, #0a2e23 70%)",
  "radial-gradient(120% 120% at 75% 20%, #14523b 0%, #04140d 70%)",
  "radial-gradient(120% 120% at 40% 40%, #1e6b4c 0%, #0a2e23 70%)",
];

function ringPoint(angleDeg: number, scale: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: Math.sin(rad) * RING_RADIUS * scale, y: Math.cos(rad) * RING_RADIUS * scale };
}

// Deterministic (not Math.random) so phase 1 is stable across renders —
// golden-angle spacing plus a per-index distance/rotation wobble gives an
// organic-looking scatter without any two cards landing in the same spot.
function scatterFor(i: number) {
  const angle = (i * 137.5) % 360;
  const rad = (angle * Math.PI) / 180;
  const dist = 170 + ((i * 53) % 140);
  return { x: Math.sin(rad) * dist, y: Math.cos(rad) * dist, rotate: ((i * 41) % 70) - 35 };
}

/** One card's whole journey — scattered and tumbled (phase 1) -> converging
 * toward center (phase 2) -> settled into its slot on the ring, rotated to
 * point radially outward like a spoke so the pack of cards reads as a
 * woven wreath rather than a loose cluster (phase 3, held) -> the ring
 * keeps turning and lifts as a group, still radially aligned (phase 4) —
 * all driven off the same `scrollYProgress`. */
function GalleryCard({
  industry,
  index,
  total,
  scrollYProgress,
  posScale,
}: {
  industry: (typeof RING_ITEMS)[number];
  index: number;
  total: number;
  scrollYProgress: MotionValue<number>;
  posScale: number;
}) {
  const Icon = industry.icon;
  const scatter = useMemo(() => scatterFor(index), [index]);
  const angleBase = (index / total) * 360;
  const ringNow = useMemo(() => ringPoint(angleBase, posScale), [angleBase, posScale]);
  const ringShifted = useMemo(() => ringPoint(angleBase + ARC_SHIFT_DEG, posScale), [angleBase, posScale]);
  const lift = 60 * posScale;

  // The ring (0.42) holds its exact position through 0.62 before the arc
  // shift starts — without a hold, "converging" flows straight into
  // "arcing away" and a normal-speed scroll never actually shows a formed
  // ring, just a blur of cards never settling anywhere.
  const stops = [0, 0.22, 0.42, 0.62, 1];
  const x = useTransform(scrollYProgress, stops, [scatter.x * posScale, scatter.x * posScale * 0.4, ringNow.x, ringNow.x, ringShifted.x]);
  const y = useTransform(scrollYProgress, stops, [scatter.y * posScale, scatter.y * posScale * 0.4, ringNow.y, ringNow.y, ringShifted.y - lift]);
  // -angleBase points each card's bottom edge (where the label sits)
  // radially outward, away from the center text — like spokes on a wheel.
  const rotate = useTransform(scrollYProgress, stops, [scatter.rotate, scatter.rotate * 0.3, -angleBase, -angleBase, -(angleBase + ARC_SHIFT_DEG)]);
  const scale = useTransform(scrollYProgress, stops, [0.5, 0.8, 1, 1, 0.92]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.22, 1], ["46%", "18px", "18px"]);
  const opacity = useTransform(scrollYProgress, [0, 0.1, 1], [0, 1, 1]);
  // The card itself rotates a full 360deg around the ring (so the pack
  // reads as spokes), which would flip the label text upside down for any
  // card past the ring's far side — counter-rotating just the label keeps
  // it level and readable regardless of which way the card is tilted.
  const counterRotate = useTransform(rotate, (r) => -r);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 h-28 w-20 overflow-hidden shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)] sm:h-32 sm:w-24"
      style={{ x, y, rotate, scale, opacity, borderRadius, marginLeft: "-2.5rem", marginTop: "-3.5rem", willChange: "transform" }}
    >
      <div className="absolute inset-0" style={{ background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }} />
      <Icon aria-hidden="true" className="absolute -right-2 -top-2 h-12 w-12 text-[var(--aurora-highlight)] opacity-25" strokeWidth={1.25} />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2">
        <motion.p className="text-[9px] font-medium leading-tight text-white sm:text-[10px]" style={{ rotate: counterRotate }}>
          {industry.label}
        </motion.p>
      </div>
    </motion.div>
  );
}

/** Reduced motion only — a ~250vh pinned scroll section that only resolves
 * through drag-scrolling would be actively disorienting with motion
 * turned off. A plain static grid of the 6 real verticals gets the same
 * content across without depending on scroll-driven animation at all. */
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

// The ring's own radius has to shrink to fit a narrow phone width without
// spilling past the screen edges — floor picked so RING_RADIUS * floor +
// half the card width stays comfortably inside a 375px viewport.
function computePositionScale(width: number) {
  return Math.max(0.56, Math.min(1, width / 900));
}

export default function IndustryScrollGallery() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [posScale, setPosScale] = useState(1);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  useEffect(() => {
    const reducedMql = window.matchMedia(SAFE_MATCH_MEDIA);
    const updateReduced = () => setReducedMotion(reducedMql.matches);
    updateReduced();
    reducedMql.addEventListener("change", updateReduced);

    const updateScale = () => setPosScale(computePositionScale(window.innerWidth));
    updateScale();
    window.addEventListener("resize", updateScale);

    return () => {
      reducedMql.removeEventListener("change", updateReduced);
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  if (reducedMotion) {
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

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          <p className="mb-1.5 text-[9px] font-semibold tracking-[0.25em] text-zinc-500 sm:mb-3 sm:text-xs sm:tracking-[0.3em]">PARA QUIÉN ES ESTO</p>
          <h2 className="max-w-[9.5rem] text-balance font-[family-name:var(--font-display)] text-sm italic leading-tight tracking-tight text-white sm:max-w-sm sm:text-2xl md:text-3xl">
            Contenido para cualquier tipo de negocio
          </h2>
          <p className="mt-1.5 text-[9px] font-semibold tracking-[0.25em] text-zinc-500 sm:mt-4 sm:text-xs sm:tracking-[0.3em]">DESLIZA</p>
        </div>

        {RING_ITEMS.map((item, i) => (
          <GalleryCard key={item.id} industry={item} index={i} total={RING_COUNT} scrollYProgress={scrollYProgress} posScale={posScale} />
        ))}
      </div>
    </section>
  );
}
