import { MapPin } from "lucide-react";

// Real, verifiable facts about Praeko itself — no usage/customer metrics,
// since there are no paying customers yet to measure. Mirrors the
// reference's "big number + map + supporting stats" layout, but every
// number here is something the site can actually back up elsewhere on
// the page (agent count, plan count, connected networks).
const SUPPORTING_STATS = [
  { value: "3", label: "Planes, desde $99/mes" },
  { value: "3", label: "Redes sociales conectadas" },
  { value: "100%", label: "Contenido en español" },
];

const CITIES = [
  { name: "Ciudad de México", top: "38%", left: "48%" },
  { name: "Guadalajara", top: "44%", left: "28%" },
  { name: "Monterrey", top: "22%", left: "44%" },
  { name: "Puebla", top: "50%", left: "58%" },
];

export default function StatsShowcase() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <span className="inline-flex items-center rounded-full bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-zinc-950">
          Cómo trabajamos
        </span>
        <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          Así de simple es publicar con Praeko
        </h2>
        <p className="mt-6 text-6xl font-semibold tracking-tight text-accent sm:text-7xl">5</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Agentes de IA trabajando por tu negocio, todos los días</p>
      </div>

      {/* A map of the cities Praeko is built for, not a spinning globe —
          Praeko operates in México only, so a world globe would overstate
          reach that doesn't exist. Purely decorative: no claim about how
          many businesses are actually in each city. */}
      <div className="relative mx-auto mt-14 h-64 w-full max-w-md sm:h-72">
        <div
          className="absolute inset-0 rounded-[3rem] opacity-60"
          style={{
            backgroundImage: "radial-gradient(var(--hairline) 1.5px, transparent 1.5px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="absolute inset-6 rounded-[2.5rem] border border-[var(--hairline)]" />
        {CITIES.map((city) => (
          <div key={city.name} className="absolute flex -translate-x-1/2 -translate-y-full flex-col items-center" style={{ top: city.top, left: city.left }}>
            <span className="whitespace-nowrap rounded-full bg-zinc-950 px-2.5 py-1 text-[10px] font-medium text-white dark:bg-white dark:text-zinc-950">
              {city.name}
            </span>
            <MapPin aria-hidden="true" className="mt-1 h-5 w-5 fill-accent text-accent" strokeWidth={0} />
          </div>
        ))}
      </div>

      <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-8 px-6 text-center sm:grid-cols-3">
        {SUPPORTING_STATS.map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">{stat.value}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
