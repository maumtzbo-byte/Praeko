import { Play } from "lucide-react";

// Praeko doesn't have real generated output to show yet (fal.ai is still a
// stub) — honest placeholders instead of faking finished videos. Swap each
// for a real generated clip's thumbnail as soon as there's one worth
// showing.
const PLACEHOLDER_VIDEOS = Array.from({ length: 8 }, (_, i) => i + 1);

function VideoCard({ n }: { n: number }) {
  return (
    <div className="w-40 shrink-0 sm:w-48">
      {/* A soft gradient + real shadow instead of a flat fill behind a
          dashed border — still unmistakably a placeholder (play icon,
          "Video N" label), just one that reads as considered instead of
          wireframe. */}
      <div
        className="relative flex items-center justify-center overflow-hidden rounded-2xl border border-[var(--hairline)] bg-gradient-to-br from-zinc-50 via-white to-zinc-100 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_40px_-24px_rgba(0,0,0,0.25)] dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950 dark:shadow-[0_1px_2px_rgba(0,0,0,0.3),0_20px_40px_-24px_rgba(0,0,0,0.6)]"
        style={{ aspectRatio: "9 / 16" }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ background: "radial-gradient(circle at 50% 32%, var(--accent) 0%, transparent 60%)" }}
        />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-[0_6px_16px_-4px_rgba(0,0,0,0.18)] ring-1 ring-accent/15 dark:bg-zinc-800">
          <Play className="ml-0.5 h-4 w-4 fill-accent text-accent" />
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
