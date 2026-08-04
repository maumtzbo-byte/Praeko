import { Play, Dumbbell, UtensilsCrossed, Sparkles, ShoppingBag, HeartPulse, Briefcase, type LucideIcon } from "lucide-react";

// Example content Frames actually generates, one per real target industry
// — not customer testimonials (Frames has no paying customers yet to
// quote), just a demo of the kind of video the product produces. Same
// "don't invent an identity" rule as everywhere else on the site: no
// fabricated business name attached to any of these. Same taxonomy (and
// now the same icon per industry) as IndustryScrollGallery further down
// the page, so this row and that one read as one system, not two
// unrelated lists that happen to share words.
const EXAMPLE_VIDEOS: { industry: string; caption: string; icon: LucideIcon }[] = [
  { industry: "Gimnasio o estudio boutique", caption: "Rutina de la semana: piernas y core", icon: Dumbbell },
  { industry: "Restaurante o cafetería", caption: "Platillo del día: risotto de temporada", icon: UtensilsCrossed },
  { industry: "Belleza y estética", caption: "Antes y después: tratamiento facial", icon: Sparkles },
  { industry: "Retail o tienda", caption: "Nueva colección ya disponible", icon: ShoppingBag },
  { industry: "Salud y bienestar", caption: "3 tips para dormir mejor", icon: HeartPulse },
  { industry: "Servicios profesionales", caption: "Cómo trabajamos con nuevos clientes", icon: Briefcase },
];

// Same sky-blue family as the Hero, a two-tone diagonal per card instead of
// a flat fill or a stock photo — enough depth for the row to read as
// deliberate cards, not empty color swatches, while staying honest about
// what's actually behind each one.
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #5f92c4 0%, #1f3e5c 100%)",
  "linear-gradient(135deg, #7fa9d2 0%, #2c5378 100%)",
  "linear-gradient(135deg, #6a9ac8 0%, #17324d 100%)",
  "linear-gradient(135deg, #4a7fb8 0%, #264a6e 100%)",
  "linear-gradient(135deg, #8ab4dc 0%, #1f3e5c 100%)",
  "linear-gradient(135deg, #5f92c4 0%, #2c5378 100%)",
];

function VideoCard({
  industry,
  caption,
  gradient,
  Icon,
}: {
  industry: string;
  caption: string;
  gradient: string;
  Icon: LucideIcon;
}) {
  return (
    <div
      className="relative aspect-[9/16] w-48 shrink-0 overflow-hidden rounded-2xl md:w-56 md:rounded-3xl"
      style={{ backgroundImage: gradient }}
    >
      {/* The industry's own icon, oversized and barely-there — gives each
          card a reason to look different from the others beyond just its
          color, without pretending it's a real screenshot. */}
      <Icon
        aria-hidden="true"
        strokeWidth={1.25}
        className="pointer-events-none absolute -bottom-6 -right-6 h-32 w-32 rotate-[-8deg] text-white/[0.14] md:h-36 md:w-36"
      />
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

// Doubled so the track can translate exactly -50% and loop with no
// visible seam or reset jump — same trick .marquee-track already uses
// for the testimonials/logo rows elsewhere on the site.
const DOUBLED_VIDEOS = [...EXAMPLE_VIDEOS, ...EXAMPLE_VIDEOS];

export default function VideoShowcase() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">CONTENIDO GENERADO POR IA</p>
        <h2 className="max-w-lg text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Videos hechos por nosotros, listos para publicar
        </h2>
      </div>

      {/* Auto-scrolling, not a manual drag row — pauses on hover (see
          .marquee-viewport in globals.css), fades out at both edges so
          cards don't just clip abruptly at the container boundary. */}
      <div className="marquee-viewport mt-10 [mask-image:linear-gradient(to_right,transparent_0%,black_4%,black_96%,transparent_100%)]">
        <div className="marquee-track flex w-max gap-4 px-6 md:gap-5" style={{ animationDuration: "38s" }}>
          {DOUBLED_VIDEOS.map((video, i) => (
            <VideoCard
              key={`${video.industry}-${i}`}
              industry={video.industry}
              caption={video.caption}
              gradient={CARD_GRADIENTS[i % CARD_GRADIENTS.length]}
              Icon={video.icon}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
