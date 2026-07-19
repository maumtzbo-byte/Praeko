import { Star } from "lucide-react";

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

function ReviewCard({ industry, quote }: { industry: string; quote: string }) {
  return (
    <div className="flex w-80 shrink-0 flex-col gap-3 rounded-3xl border border-[var(--hairline)] bg-white/70 p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_28px_-16px_rgba(0,0,0,0.18)]">
      <div className="flex gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-zinc-700">&ldquo;{quote}&rdquo;</p>
      <p className="text-xs font-medium tracking-wide text-zinc-500">Negocio de {industry.toLowerCase()}</p>
    </div>
  );
}

export default function SocialProof() {
  const cards = [...PLACEHOLDER_REVIEWS, ...PLACEHOLDER_REVIEWS];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">CONFIANZA</p>
        <h2 className="max-w-lg text-balance font-[family-name:var(--font-display)] text-2xl italic tracking-tight text-zinc-950 sm:text-3xl">
          Hecho para negocios como el tuyo
        </h2>
      </div>

      <div className="marquee-viewport mt-10 [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)]">
        <div className="marquee-track flex w-max gap-5 px-6">
          {cards.map((review, i) => (
            <ReviewCard key={i} industry={review.industry} quote={review.quote} />
          ))}
        </div>
      </div>
    </section>
  );
}
