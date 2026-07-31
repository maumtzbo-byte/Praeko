import { Play } from "lucide-react";

// Example content Praeko actually generates, one per real target industry
// — not customer testimonials (Praeko has no paying customers yet to
// quote), just a demo of the kind of video the product produces. Same
// "don't invent an identity" rule as everywhere else on the site: no
// fabricated business name attached to any of these.
const EXAMPLE_VIDEOS = [
  { industry: "Gimnasio o estudio boutique", caption: "Rutina de la semana: piernas y core" },
  { industry: "Restaurante o cafetería", caption: "Platillo del día: risotto de temporada" },
  { industry: "Belleza y estética", caption: "Antes y después: tratamiento facial" },
  { industry: "Retail o tienda", caption: "Nueva colección ya disponible" },
  { industry: "Salud y bienestar", caption: "3 tips para dormir mejor" },
  { industry: "Servicios profesionales", caption: "Cómo trabajamos con nuevos clientes" },
];

// Same sky-blue family as the Hero, one flat tone per card instead of a
// stock photo — enough variation for the row to not look monotonous while
// staying honest about what's actually behind each card.
const CARD_BACKGROUNDS = ["#3d75ad", "#1f3e5c", "#5f92c4", "#264a6e", "#7fa9d2", "#2c5378"];

function VideoCard({ industry, caption, background }: { industry: string; caption: string; background: string }) {
  return (
    <div
      className="relative aspect-[9/16] w-48 shrink-0 snap-center overflow-hidden rounded-2xl md:w-56 md:rounded-3xl"
      style={{ background }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/20" />
      <p className="absolute left-3 top-3 text-[10px] font-medium text-white/80 md:left-4 md:top-4">{industry}</p>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm md:h-12 md:w-12">
          <Play className="h-4 w-4 fill-white text-white md:h-5 md:w-5" />
        </span>
      </span>
      <p className="absolute inset-x-3 bottom-3 text-xs font-medium leading-snug text-white md:inset-x-4 md:bottom-4">{caption}</p>
    </div>
  );
}

export default function VideoShowcase() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">CONTENIDO GENERADO POR IA</p>
        <h2 className="max-w-lg text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Videos hechos por nosotros, listos para publicar
        </h2>
      </div>

      {/* A horizontal row that bleeds past the right edge, not a grid that
          fits everything evenly — same feel as the reference's row of
          photo cards. */}
      <div className="mt-10 flex snap-x gap-4 overflow-x-auto px-6 pb-2 md:gap-5 md:px-[max(1.5rem,calc((100vw-72rem)/2))]">
        {EXAMPLE_VIDEOS.map((video, i) => (
          <VideoCard key={video.industry} industry={video.industry} caption={video.caption} background={CARD_BACKGROUNDS[i % CARD_BACKGROUNDS.length]} />
        ))}
      </div>
    </section>
  );
}
