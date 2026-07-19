"use client";

import { useRef, useState, type ComponentType } from "react";
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
  // Tracks an in-progress touch gesture on the list — not React state,
  // since it's read/written every touchmove and shouldn't trigger renders.
  const dragRef = useRef<{ x: number; y: number; moved: boolean; wasOpen: boolean } | null>(null);

  // Keeps the floating card fully on-screen — on a narrow phone a tap near
  // the left/right edge or near the top of the list would otherwise push
  // the centered, upward-offset card partly off the viewport.
  function setPreviewPosition(clientX: number, clientY: number, instant = false) {
    const halfCardWidth = 96; // PreviewCard default width (w-48) / 2
    const cardHeight = 248; // approx image (aspect-square, 192px) + text block
    const margin = 16;
    const nx = Math.min(Math.max(clientX, halfCardWidth + margin), window.innerWidth - halfCardWidth - margin);
    const ny = Math.min(Math.max(clientY, cardHeight + margin), window.innerHeight - margin);
    mouseX.set(nx);
    mouseY.set(ny);
    if (instant) {
      // A fresh touch is a discrete point, not a moving cursor, so there's
      // nothing to spring-trail yet — jump straight to the touch point
      // instead of easing in from wherever it last was.
      springX.jump(nx);
      springY.jump(ny);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    setPreviewPosition(e.clientX, e.clientY);
  }

  function itemIndexAtPoint(clientX: number, clientY: number): number | null {
    const el = document.elementFromPoint(clientX, clientY);
    const li = el instanceof Element ? el.closest("li[data-index]") : null;
    if (!li) return null;
    const idx = Number(li.getAttribute("data-index"));
    return Number.isNaN(idx) ? null : idx;
  }

  // Touch has no hover, so dragging a finger across the list stands in for
  // it — same floating preview, live-following the finger and swapping
  // between items as it crosses them, same as the reference clip. A plain
  // tap (no real movement) instead toggles the preview open/closed, so a
  // quick touch still works like the rest of the site.
  function handleListPointerDown(e: React.PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== "touch") return;
    const idx = itemIndexAtPoint(e.clientX, e.clientY);
    if (idx === null) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, moved: false, wasOpen: hovered === idx };
    setPreviewPosition(e.clientX, e.clientY, true);
    setHovered(idx);
  }

  function handleListPointerMove(e: React.PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== "touch" || !dragRef.current) return;
    const drag = dragRef.current;
    if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 10) {
      drag.moved = true;
    }
    if (drag.moved) {
      setPreviewPosition(e.clientX, e.clientY);
      setHovered(itemIndexAtPoint(e.clientX, e.clientY));
    }
  }

  function handleListPointerEnd(e: React.PointerEvent<HTMLUListElement>) {
    if (e.pointerType !== "touch" || !dragRef.current) return;
    const { moved, wasOpen } = dragRef.current;
    if (moved || wasOpen) {
      // Dragging reveals only while the finger moves, like the reference
      // clip — lift and it's gone. A tap on an already-open item is a
      // close toggle. A tap on a closed item is left open (see below).
      setHovered(null);
    }
    dragRef.current = null;
  }

  return (
    <section className="relative py-24" onMouseMove={handleMouseMove}>
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">EJEMPLOS</p>
          <h2 className="text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Contenido pensado para tu tipo de negocio
          </h2>
          <p className="mt-4 text-zinc-600">
            Toca o arrastra el dedo (o pasa el cursor) sobre cada uno para ver el formato que le toca.
          </p>
        </div>

        <ul
          className="mt-12 touch-none"
          onPointerDown={handleListPointerDown}
          onPointerMove={handleListPointerMove}
          onPointerUp={handleListPointerEnd}
          onPointerCancel={handleListPointerEnd}
        >
          {SHOWCASE_ITEMS.map((item, i) => (
            <li
              key={item.label}
              data-index={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="flex cursor-default items-center justify-between border-b border-[var(--hairline)] py-5 transition-colors first:border-t sm:py-6"
            >
              <span
                className={`text-xl font-medium tracking-tight transition-colors sm:text-2xl ${
                  hovered === i ? "text-zinc-950" : "text-zinc-400"
                }`}
              >
                {item.label}
              </span>
              <span className="text-sm text-zinc-400">{item.format}</span>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            className="pointer-events-none fixed left-0 top-0 z-50"
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
