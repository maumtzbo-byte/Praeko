"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useTransform, animate, type PanInfo, type MotionValue } from "framer-motion";
import { Compass, Sparkles, Send, MessageCircle, BarChart3, type LucideIcon } from "lucide-react";

export interface CarouselAgent {
  title: string;
  description: string;
}

const ICONS: LucideIcon[] = [Compass, Sparkles, Send, MessageCircle, BarChart3];

// All five stay in the forest-green family (never the light beige/cream
// tones) so white card text is legible over every one of them without
// per-card contrast tweaks — variety comes from the gradient angle/mix, not
// from lightness.
const CARD_GRADIENTS = [
  "radial-gradient(120% 120% at 20% 15%, #1e6b4c 0%, #04140d 70%)",
  "radial-gradient(120% 120% at 80% 25%, #237a56 0%, #0a2e23 70%)",
  "radial-gradient(120% 120% at 50% 85%, #0a2e23 0%, #04140d 70%)",
  "radial-gradient(120% 120% at 25% 75%, #1e6b4c 0%, #0a2e23 70%)",
  "radial-gradient(120% 120% at 75% 20%, #14523b 0%, #04140d 70%)",
];

const CARD_WIDTH = 232;
const CARD_HEIGHT = 320;
const RADIUS = 300;
const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;
const DRAG_SENSITIVITY = 0.35; // degrees of rotation per pixel dragged
const SAFE_MATCH_MEDIA = "(prefers-reduced-motion: reduce)";

function normalizeAngleDeg(deg: number) {
  const wrapped = deg % 360;
  return wrapped > 180 ? wrapped - 360 : wrapped < -180 ? wrapped + 360 : wrapped;
}

// Fades fully to 0 by 130deg — well short of the 144deg the two farthest
// cards sit at in a 5-card ring. Without a hard cutoff like this, a card
// rotated past 90deg is showing its CSS backface (a mirrored, garbled
// version of its own front), which read as a rendering bug rather than
// "distant and dim." backfaceVisibility: hidden below is a second layer of
// the same fix, in case this ever fades slower than the cutoff.
const OPACITY_CUTOFF_DEG = 130;

function facingOpacity(cardAngle: number, rotation: number) {
  const angle = Math.abs(normalizeAngleDeg(cardAngle + rotation));
  const t = Math.max(1 - angle / OPACITY_CUTOFF_DEG, 0);
  return t * t * (3 - 2 * t);
}

function facingBrightness(cardAngle: number, rotation: number) {
  const facing = Math.cos((normalizeAngleDeg(cardAngle + rotation) * Math.PI) / 180);
  return 0.55 + 0.45 * Math.max(facing, 0);
}

function AgentCard({
  agent,
  index,
  total,
  cardAngle,
  rotation,
  onSelect,
}: {
  agent: CarouselAgent;
  index: number;
  total: number;
  cardAngle: number;
  rotation: MotionValue<number>;
  onSelect: () => void;
}) {
  const Icon = ICONS[index % ICONS.length];
  const opacity = useTransform(rotation, (r) => facingOpacity(cardAngle, r));
  const brightness = useTransform(rotation, (r) => `brightness(${facingBrightness(cardAngle, r)})`);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      aria-label={`Ver ${agent.title}`}
      style={{
        position: "absolute",
        inset: 0,
        margin: "auto",
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        transform: `rotateY(${cardAngle}deg) translateZ(${RADIUS}px)`,
        opacity,
        filter: brightness,
        backfaceVisibility: "hidden",
      }}
      className="overflow-hidden rounded-2xl text-left shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]"
    >
      <div className="absolute inset-0" style={{ background: CARD_GRADIENTS[index % CARD_GRADIENTS.length] }} />
      <Icon
        aria-hidden="true"
        className="absolute -right-6 -top-6 h-40 w-40 text-[var(--aurora-highlight)] opacity-20"
        strokeWidth={1.25}
      />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="text-lg font-bold leading-snug">{agent.title}</h3>
        <p className="mt-1.5 text-xs italic leading-relaxed text-white/75">{agent.description}</p>
        <p className="mt-3 text-[10px] font-medium tracking-[0.15em] text-white/45">
          AGENTE {String(index + 1).padStart(2, "0")} DE {String(total).padStart(2, "0")}
        </p>
      </div>
    </motion.button>
  );
}

export default function AgentCylinderCarousel({
  agents,
  activeIndex,
  onActiveIndexChange,
  className,
}: {
  agents: CarouselAgent[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  className?: string;
}) {
  const cardAngle = 360 / agents.length;
  const rotation = useMotionValue(-activeIndex * cardAngle);
  const dragStartRotation = useRef(0);
  const draggedRef = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(SAFE_MATCH_MEDIA);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-mount read of a client-only API (matchMedia), not derivable during render.
    setReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const controls = animate(rotation, -activeIndex * cardAngle, reducedMotion ? { duration: 0 } : SPRING);
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `rotation` is a stable motion value ref, not render state.
  }, [activeIndex, cardAngle, reducedMotion]);

  function handlePanStart() {
    dragStartRotation.current = rotation.get();
    draggedRef.current = false;
  }

  function handlePan(_event: PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > 3) draggedRef.current = true;
    rotation.set(dragStartRotation.current + info.offset.x * DRAG_SENSITIVITY);
  }

  function handlePanEnd() {
    if (!draggedRef.current) return;
    const nearest = Math.round(-rotation.get() / cardAngle);
    const clamped = Math.max(0, Math.min(agents.length - 1, nearest));
    onActiveIndexChange(clamped);
    animate(rotation, -clamped * cardAngle, reducedMotion ? { duration: 0 } : SPRING);
  }

  return (
    <motion.div
      className={className}
      style={{ perspective: "1400px", touchAction: "pan-y", cursor: "grab" }}
      onPanStart={handlePanStart}
      onPan={handlePan}
      onPanEnd={handlePanEnd}
    >
      <motion.div
        style={{ transformStyle: "preserve-3d", rotateY: rotation, width: "100%", height: "100%", position: "relative" }}
      >
        {agents.map((agent, i) => (
          <AgentCard
            key={agent.title}
            agent={agent}
            index={i}
            total={agents.length}
            cardAngle={i * cardAngle}
            rotation={rotation}
            onSelect={() => onActiveIndexChange(i)}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
