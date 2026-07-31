import { Sunrise, Mountain, Globe2, PawPrint, Flower2, Waves, TreePine, Building2, type LucideIcon } from "lucide-react";

/** Real stock photography would be the obvious choice here, but every
 * photo CDN (Unsplash, Pexels, Picsum, Wikimedia) is unreachable from this
 * environment's network — so these are gradient "photo" cards instead of
 * actual images, same trick VideoShowcase already uses for its example
 * cards. Themed and colored to evoke the same variety a real photo grid
 * would (sunset, mountains, space, an animal, flowers, ocean, forest, a
 * skyline) rather than reading as one flat brand-blue wash. */
const CARDS: { icon: LucideIcon; from: string; to: string }[] = [
  { icon: Sunrise, from: "#f7b267", to: "#f4845f" },
  { icon: Mountain, from: "#8d99ae", to: "#4a5568" },
  { icon: Globe2, from: "#1f3e5c", to: "#0a1628" },
  { icon: PawPrint, from: "#d8c9b8", to: "#a08c78" },
  { icon: Flower2, from: "#f582ae", to: "#c9184a" },
  { icon: Waves, from: "#7fb1dd", to: "#3d75ad" },
  { icon: TreePine, from: "#6b9b6e", to: "#2f5233" },
  { icon: Building2, from: "#cfe6f8", to: "#7fa9d2" },
];

/** One card's vertical offset — a sine wave across the row index instead
 * of a strict alternating up/down, so the row reads as one continuous
 * undulating line (the "snake") rather than a sawtooth zigzag. */
function waveOffset(index: number) {
  return Math.sin(index * 0.9) * 22;
}

function GalleryRow({ reverse, durationS, startOffset }: { reverse?: boolean; durationS: number; startOffset: number }) {
  const cards = [...CARDS, ...CARDS];
  return (
    <div className="marquee-viewport w-full">
      <div
        className={`marquee-track flex w-max items-center gap-5 px-2.5 ${reverse ? "marquee-track-reverse" : ""}`}
        style={{ animationDuration: `${durationS}s` }}
      >
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="relative flex h-40 w-28 shrink-0 items-center justify-center overflow-hidden rounded-3xl shadow-[0_20px_40px_-24px_rgba(0,0,0,0.35)] sm:h-48 sm:w-32"
              style={{
                background: `linear-gradient(160deg, ${card.from} 0%, ${card.to} 100%)`,
                transform: `translateY(${waveOffset(i + startOffset)}px)`,
              }}
            >
              <Icon className="h-7 w-7 text-white/80" strokeWidth={1.5} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Ambient background for the auth pages: rows of gradient cards drifting
 * sideways at different speeds/directions, each one riding a sine-wave
 * vertical offset so the row reads as a slithering line of cards, not a
 * flat grid. Purely decorative — aria-hidden, and the sign-in/sign-up
 * card sits on top with its own opaque background, so none of this ever
 * competes with the form for legibility. */
export function AuthGallery() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 flex flex-col justify-center gap-8 overflow-hidden">
      <GalleryRow durationS={48} startOffset={0} />
      <GalleryRow reverse durationS={38} startOffset={3} />
      <GalleryRow durationS={54} startOffset={6} />
      {/* Fades the gallery into the page's own background toward the
          center, so the auth card (and the wordmark sitting above it)
          reads as sitting on a plain page with the gallery as texture at
          the edges, not competing artwork directly behind either. Centered
          a bit above 50% and taller than it is wide, since the wordmark +
          card block together sit higher and taller than a plain center
          point would cover. */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 72% at 50% 46%, var(--background) 0%, var(--background) 42%, transparent 82%)",
        }}
      />
    </div>
  );
}
