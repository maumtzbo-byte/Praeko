// Real, verifiable facts about Praeko itself — no usage/customer metrics,
// since there are no paying customers yet to measure. Mirrors the
// reference's "big number + globe + supporting stats" layout, but every
// number here is something the site can actually back up elsewhere on
// the page (agent count, plan count, connected networks).
const SUPPORTING_STATS = [
  { value: "3", label: "Planes, desde $99/mes" },
  { value: "3", label: "Redes sociales conectadas" },
  { value: "100%", label: "Contenido en español" },
];

// Purely decorative sphere (gradient shading + latitude/longitude lines +
// abstract landmass blobs, not a real geographic projection) — same role
// the reference's globe plays, without attaching any reach/coverage claim
// to it.
function Globe() {
  return (
    <svg viewBox="0 0 200 200" className="h-56 w-56 sm:h-64 sm:w-64" aria-hidden="true">
      <defs>
        <radialGradient id="globe-sphere" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#bcdcf0" />
          <stop offset="45%" stopColor="#3d75ad" />
          <stop offset="100%" stopColor="#152e45" />
        </radialGradient>
        <clipPath id="globe-clip">
          <circle cx="100" cy="100" r="96" />
        </clipPath>
      </defs>
      <circle cx="100" cy="100" r="96" fill="url(#globe-sphere)" />
      <g clipPath="url(#globe-clip)" opacity="0.9">
        <path d="M38 68 Q54 52 76 60 Q97 67 91 86 Q80 102 58 99 Q38 96 38 68Z" fill="#8fae6e" />
        <path d="M112 48 Q138 43 152 60 Q162 79 146 92 Q125 97 114 81 Q104 65 112 48Z" fill="#8fae6e" />
        <path d="M58 122 Q80 116 96 132 Q101 152 80 160 Q59 157 54 139 Q51 129 58 122Z" fill="#a7c184" />
        <path d="M132 122 Q152 120 162 137 Q160 152 141 154 Q126 147 126 134 Q127 126 132 122Z" fill="#a7c184" />
      </g>
      <g stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="none">
        <ellipse cx="100" cy="100" rx="96" ry="28" />
        <ellipse cx="100" cy="100" rx="96" ry="60" />
        <line x1="4" y1="100" x2="196" y2="100" strokeOpacity="0.5" />
        <ellipse cx="100" cy="100" rx="30" ry="96" />
        <ellipse cx="100" cy="100" rx="62" ry="96" />
      </g>
      <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="2" />
    </svg>
  );
}

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

      <div className="mx-auto mt-14 flex justify-center">
        <Globe />
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
