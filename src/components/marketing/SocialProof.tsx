// Placeholder content — Praeko doesn't have paying customers yet (fal.ai and
// Stripe aren't wired up), so this deliberately avoids inventing a specific
// person or business name/photo that would read as a real, verified review.
// Each card is tied to a real target industry instead of a stock photo of a
// stranger standing in for a "founder" who doesn't exist. Replace with real
// customer photos/quotes as soon as there are real customers to show.
const PLACEHOLDER_REVIEWS = [
  { industry: "Gimnasio o estudio boutique", quote: "Ahora nuestras clases se llenan solas — el contenido sale cada semana sin que nadie lo piense." },
  { industry: "Restaurante o cafetería", quote: "Dejamos de improvisar qué publicar cada día. Ya está resuelto desde el lunes." },
  { industry: "Belleza y estética", quote: "Los videos se ven profesionales sin que grabemos nada nosotros." },
  { industry: "Retail o tienda", quote: "Subimos catálogo nuevo cada semana sin contratar a nadie más." },
  { industry: "Salud y bienestar", quote: "Por fin publicamos consistente, no solo cuando alguien se acuerda." },
  { industry: "Servicios profesionales", quote: "Nuestras redes ya se ven tan serias como el resto del negocio." },
];

// Same sky-blue family as the Hero, one flat tone per card instead of a
// stock photo — enough variation for the row to not look monotonous while
// staying honest about what's actually behind each card.
const CARD_BACKGROUNDS = ["#3d75ad", "#1f3e5c", "#5f92c4", "#264a6e", "#7fa9d2", "#2c5378"];

function ReviewCard({ industry, quote, background }: { industry: string; quote: string; background: string }) {
  return (
    <div
      className="relative aspect-[3/4] w-64 shrink-0 snap-center overflow-hidden rounded-2xl md:w-72 md:rounded-3xl"
      style={{ background }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
      <p className="absolute left-4 top-4 text-xs font-medium text-white/90 md:left-5 md:top-5">{industry}</p>
      <p className="absolute inset-x-4 bottom-4 text-sm font-medium leading-snug text-white md:inset-x-5 md:bottom-5">
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  );
}

export default function SocialProof() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">CONFIANZA</p>
        <h2 className="max-w-lg text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Hecho para negocios como el tuyo
        </h2>
      </div>

      {/* A horizontal row that bleeds past the right edge, not a grid that
          fits everything evenly — same feel as the reference's row of
          photo cards. */}
      <div className="mt-10 flex snap-x gap-4 overflow-x-auto px-6 pb-2 md:gap-5 md:px-[max(1.5rem,calc((100vw-72rem)/2))]">
        {PLACEHOLDER_REVIEWS.map((review, i) => (
          <ReviewCard key={review.industry} industry={review.industry} quote={review.quote} background={CARD_BACKGROUNDS[i % CARD_BACKGROUNDS.length]} />
        ))}
      </div>
    </section>
  );
}
