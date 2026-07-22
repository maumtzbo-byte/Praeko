import { Play } from "lucide-react";

// Praeko doesn't have real generated output to show yet (fal.ai is still a
// stub) — honest placeholders instead of faking finished videos. Swap each
// for a real generated clip's thumbnail as soon as there's one worth
// showing.
const PLACEHOLDER_VIDEOS = Array.from({ length: 8 }, (_, i) => i + 1);

function VideoCard({ n }: { n: number }) {
  return (
    <div className="w-40 shrink-0 sm:w-48">
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--hairline)] bg-zinc-100 dark:bg-zinc-900"
        style={{ aspectRatio: "9 / 16" }}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/80 shadow-sm dark:bg-zinc-800/80">
          <Play className="h-4 w-4 fill-zinc-500 text-zinc-500 dark:fill-zinc-400 dark:text-zinc-400" />
        </span>
        <span className="absolute bottom-3 left-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Video {n}
        </span>
      </div>
    </div>
  );
}

export default function VideoShowcase() {
  const cards = [...PLACEHOLDER_VIDEOS, ...PLACEHOLDER_VIDEOS];

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500 dark:text-zinc-400">EJEMPLOS</p>
        <h2 className="max-w-lg text-balance font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Así se ve el contenido que generamos
        </h2>
        <p className="mt-4 max-w-md text-zinc-600 dark:text-zinc-400">
          Piezas de muestra — pronto verás aquí ejemplos reales generados para negocios como el tuyo.
        </p>
      </div>

      <div className="marquee-viewport mt-10 py-4 [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)]">
        <div className="marquee-track flex w-max gap-5 px-6">
          {cards.map((n, i) => (
            <VideoCard key={i} n={n} />
          ))}
        </div>
      </div>
    </section>
  );
}
