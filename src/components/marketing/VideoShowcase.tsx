import { Coffee, Droplet, Flame, Gem, Leaf, Pill, type LucideIcon } from "lucide-react";

// Ideas de contenido por categoría de producto. Son ejemplos, no obra
// terminada: no hay todavía una biblioteca de piezas reales que enseñar, y
// tampoco hay clientes que citar. La misma regla de siempre — no se
// inventa la identidad de nadie, así que ninguna trae nombre de marca.
//
// Eran seis giros (gimnasio, restaurante, estética...) y ahora son seis
// categorías de producto, las mismas del filtro: forma rígida, referencia
// que se respeta.
const EXAMPLE_VIDEOS: { industry: string; caption: string; icon: LucideIcon }[] = [
  { industry: "Skincare", caption: "El serum cayendo en cámara lenta", icon: Droplet },
  { industry: "Café de especialidad", caption: "La bolsa y la taza, luz de mañana", icon: Coffee },
  { industry: "Tés e infusiones", caption: "El agua tiñéndose, de cerca", icon: Leaf },
  { industry: "Velas y aromas", caption: "La mecha prendiendo en penumbra", icon: Flame },
  { industry: "Suplementos", caption: "El frasco girando sobre mármol", icon: Pill },
  { industry: "Joyería", caption: "La pieza en la mano, contraluz", icon: Gem },
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
      {/* Aquí había un botón de play encima de cada tarjeta. No reproducía
          nada —no hay video atrás, la tarjeta es un degradado— así que lo
          único que lograba era invitar a un clic donde no pasaba nada. Un
          control que no controla nada es peor que no tener control: quien
          lo toca aprende, en el primer scroll de la portada, que lo que ve
          aquí no es de fiar. */}
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
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">IDEAS POR CATEGORÍA</p>
        {/* Decía "Así es el tipo de video que Frames genera" arriba de
            seis tarjetas donde no hay ni un video. Lo que esta fila sí
            puede enseñar sin mentir es de qué habla cada pieza según el
            giro; el video de verdad se enseña en la muestra, que es a
            donde manda el botón. */}
        <h2 className="max-w-lg text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          De esto habla tu mes, según lo que vendes
        </h2>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
          Ideas de las que armamos cada mes. Los videos ya hechos te los mandamos en tu muestra,
          hechos con las fotos de tu propio producto.
        </p>
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
