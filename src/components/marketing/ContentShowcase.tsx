"use client";

import { useState, type ComponentType } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import {
  UtensilsCrossed,
  Dumbbell,
  Scissors,
  Building2,
  Store,
  HeartPulse,
  Users,
  Play,
  Image as ImageIcon,
  Images,
} from "lucide-react";

// Placeholder previews — Praeko doesn't have real generated output to show
// yet (fal.ai is still a stub, see LiquidMetalOrb/generar-contenido notes
// elsewhere in the codebase), so these are honest format/category mockups,
// not real photos of a real client's content. Swap for real generated
// examples once there are some.
type Format = "Video" | "Imagen" | "Carrusel";

const FORMAT_ICON: Record<Format, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Video: Play,
  Imagen: ImageIcon,
  Carrusel: Images,
};

const SHOWCASE_ITEMS: {
  label: string;
  format: Format;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  tint: string;
}[] = [
  { label: "Restaurantes y cafeterías", format: "Video", icon: UtensilsCrossed, tint: "from-orange-50 to-zinc-200" },
  { label: "Gimnasios y estudios", format: "Carrusel", icon: Dumbbell, tint: "from-blue-50 to-zinc-200" },
  { label: "Belleza y estética", format: "Imagen", icon: Scissors, tint: "from-pink-50 to-zinc-200" },
  { label: "Inmobiliarias", format: "Video", icon: Building2, tint: "from-emerald-50 to-zinc-200" },
  { label: "Retail y tiendas", format: "Carrusel", icon: Store, tint: "from-amber-50 to-zinc-200" },
  { label: "Salud y bienestar", format: "Imagen", icon: HeartPulse, tint: "from-rose-50 to-zinc-200" },
  { label: "Servicios profesionales", format: "Video", icon: Users, tint: "from-slate-50 to-zinc-200" },
];

// One entry per card, hand-tuned — deliberately not a repeating i%3
// formula, since that just reproduces a subtler grid (every card in the
// same column reads identically). Real clutter needs each card to differ
// from its immediate neighbors too.
const MOBILE_SCATTER = [
  { rotate: "rotate-[-7deg]", offset: "mt-0" },
  { rotate: "rotate-[5deg]", offset: "mt-8" },
  { rotate: "rotate-[-3deg]", offset: "mt-2" },
  { rotate: "rotate-[6deg]", offset: "mt-1" },
  { rotate: "rotate-[-5deg]", offset: "mt-7" },
  { rotate: "rotate-[4deg]", offset: "mt-3" },
  { rotate: "rotate-[-6deg]", offset: "mt-5" },
];

function PreviewCard({
  item,
  className = "w-48 shrink-0",
  compact = false,
}: {
  item: (typeof SHOWCASE_ITEMS)[number];
  className?: string;
  compact?: boolean;
}) {
  const Icon = item.icon;
  const FormatIcon = FORMAT_ICON[item.format];
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-[var(--hairline)] bg-white shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_16px_32px_-20px_rgba(0,0,0,0.4)] ${className}`}
    >
      <div className={`relative flex aspect-square items-center justify-center bg-gradient-to-br ${item.tint}`}>
        <Icon className={compact ? "h-5 w-5 text-zinc-700/60" : "h-9 w-9 text-zinc-700/60"} strokeWidth={1.25} />
        <span
          className={
            compact
              ? "absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm"
              : "absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/70 backdrop-blur-sm"
          }
        >
          <FormatIcon className={compact ? "h-2 w-2 text-zinc-700" : "h-3.5 w-3.5 text-zinc-700"} strokeWidth={1.75} />
        </span>
      </div>
      <div className={compact ? "p-1.5" : "p-3"}>
        <p className={compact ? "text-[9px] font-medium leading-tight text-zinc-600" : "text-xs font-medium text-zinc-600"}>
          {item.label}
        </p>
        {!compact && <p className="text-[11px] text-zinc-400">{item.format}</p>}
      </div>
    </div>
  );
}

export default function ContentShowcase() {
  const [hovered, setHovered] = useState<number | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { damping: 26, stiffness: 260, mass: 0.6 });
  const springY = useSpring(mouseY, { damping: 26, stiffness: 260, mass: 0.6 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }

  return (
    <section className="relative py-24" onMouseMove={handleMouseMove}>
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">EJEMPLOS</p>
          <h2 className="text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Contenido pensado para tu tipo de negocio
          </h2>
          <p className="mt-4 text-zinc-600 sm:hidden">Formatos que generamos, según tu giro.</p>
          <p className="mt-4 hidden text-zinc-600 sm:block">
            Pasa el cursor sobre cada uno para ver el formato que le toca.
          </p>
        </div>

        {/* Desktop: hover list, image floats near the cursor */}
        <ul className="mt-12 hidden sm:block">
          {SHOWCASE_ITEMS.map((item, i) => (
            <li
              key={item.label}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="flex cursor-default items-center justify-between border-b border-[var(--hairline)] py-6 transition-colors first:border-t"
            >
              <span
                className={`text-2xl font-medium tracking-tight transition-colors ${
                  hovered === i ? "text-zinc-950" : "text-zinc-400"
                }`}
              >
                {item.label}
              </span>
              <span className="text-sm text-zinc-400">{item.format}</span>
            </li>
          ))}
        </ul>

        {/* Mobile: no hover surface, so show every card at once, small
            enough that all 7 read at a glance without scrolling — each one
            gets its own hand-picked tilt + vertical offset (not a formula
            that repeats per column) so it reads as scattered examples
            tossed down, not a grid with a slight wobble. */}
        <div className="mt-10 grid grid-cols-3 gap-x-3 gap-y-10 px-1 sm:hidden">
          {SHOWCASE_ITEMS.map((item, i) => {
            const floatClass = i % 2 === 0 ? "card-float" : "card-float card-float-offset";
            const { rotate, offset } = MOBILE_SCATTER[i % MOBILE_SCATTER.length];
            return (
              <div key={item.label} className={`${floatClass} ${rotate} ${offset}`}>
                <PreviewCard item={item} className="w-full" compact />
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            className="pointer-events-none fixed left-0 top-0 z-50 hidden sm:block"
            style={{ x: springX, y: springY }}
            initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
          >
            <div className="-translate-x-1/2 -translate-y-[130%]">
              <PreviewCard item={SHOWCASE_ITEMS[hovered]} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
