"use client";

import { useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

// How far (px) the pointer has to travel inside the zone before the next
// card spawns, and how many cards stay stacked at once before the oldest
// gets dropped — tuned to read as a loose trail, not a solid smear.
const SPAWN_DISTANCE = 70;
const MAX_TRAIL = 5;

// Shown before anyone has touched the zone, so it never reads as an empty
// box waiting for something to happen — two cards already gently floating
// there, hinting at the trail without requiring the visitor to discover it
// by accident. They fade out for good on the first real interaction.
const IDLE_CARDS: { id: string; itemIndex: number; leftPct: number; topPct: number; rotate: number; offset: boolean }[] = [
  { id: "idle-1", itemIndex: 0, leftPct: 32, topPct: 44, rotate: -8, offset: false },
  { id: "idle-2", itemIndex: 3, leftPct: 68, topPct: 56, rotate: 7, offset: true },
];
// Cards render smaller on mobile (w-20) than sm:+ (w-32) — these clamp
// values track that per breakpoint so cards still land fully on-screen.
const CARD_HALF_WIDTH_MOBILE = 40; // half of w-20 (80px)
const CARD_HALF_HEIGHT_MOBILE = 56; // approx half of a compact card at that width
const CARD_HALF_WIDTH_DESKTOP = 64; // half of w-32 (128px)
const CARD_HALF_HEIGHT_DESKTOP = 82; // approx half of a compact card at that width

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

type TrailCard = { id: number; itemIndex: number; x: number; y: number; rotate: number };

export default function ContentShowcase() {
  const [trail, setTrail] = useState<TrailCard[]>([]);
  const [interacted, setInteracted] = useState(false);
  const zoneRef = useRef<HTMLDivElement>(null);
  const lastSpawnRef = useRef<{ x: number; y: number } | null>(null);
  const nextIdRef = useRef(0);
  const nextItemRef = useRef(0);

  // Spawns a card at a point inside the zone, throttled by distance so it
  // reads as a trail (one card every so many pixels of travel) instead of
  // a solid smear of cards on every pointer event. Cycles through every
  // business category in order as the trail grows, rather than repeating
  // one at random, so moving around the zone for a bit surfaces all of them.
  function spawnCardAt(clientX: number, clientY: number) {
    const zone = zoneRef.current;
    if (!zone) return;
    setInteracted(true);
    const rect = zone.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;

    if (lastSpawnRef.current) {
      const dx = rawX - lastSpawnRef.current.x;
      const dy = rawY - lastSpawnRef.current.y;
      if (Math.hypot(dx, dy) < SPAWN_DISTANCE) return;
    }
    lastSpawnRef.current = { x: rawX, y: rawY };

    const isMobile = window.innerWidth < 640;
    const halfWidth = isMobile ? CARD_HALF_WIDTH_MOBILE : CARD_HALF_WIDTH_DESKTOP;
    const halfHeight = isMobile ? CARD_HALF_HEIGHT_MOBILE : CARD_HALF_HEIGHT_DESKTOP;
    const x = Math.min(Math.max(rawX, halfWidth), Math.max(rect.width - halfWidth, halfWidth));
    const y = Math.min(Math.max(rawY, halfHeight), Math.max(rect.height - halfHeight, halfHeight));
    const itemIndex = nextItemRef.current % SHOWCASE_ITEMS.length;
    nextItemRef.current += 1;
    const rotate = (Math.random() - 0.5) * 16;
    const id = nextIdRef.current++;

    setTrail((prev) => {
      const next = [...prev, { id, itemIndex, x, y, rotate }];
      return next.length > MAX_TRAIL ? next.slice(next.length - MAX_TRAIL) : next;
    });
  }

  function clearTrail() {
    setTrail([]);
    lastSpawnRef.current = null;
  }

  // Mouse: plain hover drives this, no button needed, matching "mueve el
  // cursor." Touch: pointermove only fires between pointerdown and
  // pointerup/cancel, so the exact same handler doubles as "arrastra el
  // dedo" for free — no pointerType branching needed for movement itself.
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    spawnCardAt(e.clientX, e.clientY);
  }

  // Touch has no hover to spawn the first card, so also spawn one right on
  // touchdown — a plain tap still shows something, not just a drag.
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "touch") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    spawnCardAt(e.clientX, e.clientY);
  }

  return (
    <section className="relative py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">EJEMPLOS</p>
          <h2 className="text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Contenido pensado para tu tipo de negocio
          </h2>
          <p className="mt-4 text-zinc-600">
            <span className="hidden sm:inline">Mueve el cursor sobre el recuadro para ver los formatos que generamos.</span>
            <span className="sm:hidden">Desliza el dedo sobre el recuadro para ver los formatos que generamos.</span>
          </p>
        </div>

        <div
          ref={zoneRef}
          className="relative mt-10 h-[300px] touch-none select-none overflow-hidden rounded-3xl border border-[var(--hairline)] bg-white/40 sm:h-[360px]"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={clearTrail}
          onPointerLeave={clearTrail}
          onPointerCancel={clearTrail}
        >
          <AnimatePresence>
            {trail.length === 0 && (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute inset-x-0 bottom-5 px-6 text-center text-sm text-zinc-400"
              >
                <span className="hidden sm:inline">Mueve el cursor por aquí →</span>
                <span className="sm:hidden">Desliza el dedo por aquí →</span>
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!interacted &&
              IDLE_CARDS.map((card) => (
                <motion.div
                  key={card.id}
                  className="pointer-events-none absolute"
                  style={{ left: `${card.leftPct}%`, top: `${card.topPct}%` }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.25 } }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  {/* Static centering + rotation on this wrapper; the
                      perpetual float bob (.card-float) on the one below —
                      both set `transform`, so on one element the CSS
                      animation would silently overwrite the static rotate
                      every frame. */}
                  <div style={{ transform: `translate(-50%, -50%) rotate(${card.rotate}deg)` }}>
                    <div className={card.offset ? "card-float card-float-offset" : "card-float"}>
                      <PreviewCard item={SHOWCASE_ITEMS[card.itemIndex]} className="w-20 sm:w-32" compact />
                    </div>
                  </div>
                </motion.div>
              ))}
          </AnimatePresence>

          <AnimatePresence>
            {trail.map((card, i) => (
              <motion.div
                key={card.id}
                className="pointer-events-none absolute"
                style={{ left: card.x, top: card.y, zIndex: i }}
                initial={{ opacity: 0, scale: 0.6, x: "-50%", y: "-50%", rotate: card.rotate }}
                animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%", rotate: card.rotate }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <PreviewCard item={SHOWCASE_ITEMS[card.itemIndex]} className="w-20 sm:w-32" compact />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
