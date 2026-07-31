"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";

// Placeholder content — Praeko doesn't have paying customers yet (fal.ai and
// Stripe aren't wired up), so this deliberately avoids inventing a specific
// person or business name that would read as a real, verified review. Each
// card is tied to a real target industry (see INDUSTRY_OPTIONS in
// src/lib/onboarding/options.ts) instead. Replace with real reviews as soon
// as there are real customers to quote.
const PLACEHOLDER_REVIEWS = [
  { industry: "Gimnasio o estudio boutique", quote: "Ahora nuestras clases se llenan solas — el contenido sale cada semana sin que nadie lo piense." },
  { industry: "Restaurante o cafetería", quote: "Dejamos de improvisar qué publicar cada día. Ya está resuelto desde el lunes." },
  { industry: "Belleza y estética", quote: "Los videos se ven profesionales sin que grabemos nada nosotros." },
  { industry: "Retail o tienda", quote: "Subimos catálogo nuevo cada semana sin contratar a nadie más." },
  { industry: "Salud y bienestar", quote: "Por fin publicamos consistente, no solo cuando alguien se acuerda." },
  { industry: "Servicios profesionales", quote: "Nuestras redes ya se ven tan serias como el resto del negocio." },
];

const COLUMN_COUNT = 4;
// Slightly different durations per column so they drift out of sync with
// each other instead of marching in mechanical lockstep.
const COLUMN_DURATIONS = [24, 30, 26, 32];

// Each column starts at a different offset into the same review list (so
// columns never show identical rows side by side), then doubles itself —
// the same "duplicate the children, translate exactly -50%" trick
// .marquee-track already uses horizontally, just vertically here.
function buildColumn(offset: number) {
  const rotated = [...PLACEHOLDER_REVIEWS.slice(offset), ...PLACEHOLDER_REVIEWS.slice(0, offset)];
  return [...rotated, ...rotated];
}

function ReviewCard({ industry, quote }: { industry: string; quote: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="flex w-full flex-col gap-3 rounded-3xl border border-white/10 bg-zinc-900/70 p-6 backdrop-blur-sm transition-shadow duration-300 hover:border-accent/40 hover:shadow-[0_0_0_1px_rgba(30,107,76,0.35),0_20px_40px_-16px_rgba(0,0,0,0.6)]"
    >
      <div className="flex gap-0.5 text-accent">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-zinc-300">&ldquo;{quote}&rdquo;</p>
      <p className="text-xs font-medium tracking-wide text-zinc-500">Negocio de {industry.toLowerCase()}</p>
    </motion.div>
  );
}

function MarqueeColumn({
  reviews,
  duration,
  direction,
}: {
  reviews: typeof PLACEHOLDER_REVIEWS;
  duration: number;
  direction: "up" | "down";
}) {
  return (
    <div className="marquee-viewport-y">
      <div
        className={`flex flex-col gap-5 ${direction === "up" ? "marquee-track-y-up" : "marquee-track-y-down"}`}
        style={{ animationDuration: `${duration}s` }}
      >
        {reviews.map((review, i) => (
          <ReviewCard key={i} industry={review.industry} quote={review.quote} />
        ))}
      </div>
    </div>
  );
}

export default function SocialProof() {
  const columns = Array.from({ length: COLUMN_COUNT }, (_, c) => buildColumn(c % PLACEHOLDER_REVIEWS.length));

  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">CONFIANZA</p>
        <h2 className="max-w-lg text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Hecho para negocios como el tuyo
        </h2>
      </div>

      {/* Columns drifting in alternating directions — flat, no perspective
          tilt. Only 2 columns render at phone widths (the outer 2 stay
          `hidden` — CSS display:none drops them from grid layout entirely,
          so `grid-cols-2` correctly fills with just the 2 visible ones);
          sm: and up brings all 4 back. Columns 0/2 climb, 1/3 descend, so
          neighbors are always crossing rather than scrolling in lockstep. */}
      <div className="relative mt-12 h-[420px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_12%,black_88%,transparent_100%)] sm:h-[560px]">
        <div className="mx-auto grid h-full max-w-6xl grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:gap-5 sm:px-6">
          {columns.map((reviews, c) => (
            <div key={c} className={c === 0 || c === 3 ? "hidden sm:block" : ""}>
              <MarqueeColumn reviews={reviews} duration={COLUMN_DURATIONS[c]} direction={c % 2 === 0 ? "up" : "down"} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
