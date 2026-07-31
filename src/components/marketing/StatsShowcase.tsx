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

// Purely decorative — a large, photo-like sphere cropped by the section
// (only the top curve visible, like a close-up satellite shot), not a
// small grid-lined globe icon. Layered organic blobs in several
// green/tan tones fake terrain variation instead of clean cartoon
// continents, and a soft atmosphere rim reads as the glow at the edge of
// a lit planet. No reach/coverage claim attached — purely ornamental,
// same role the reference's globe plays.
function Globe() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-3xl overflow-hidden">
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <radialGradient id="globe-sphere" cx="32%" cy="26%" r="80%">
            <stop offset="0%" stopColor="#dff0fb" />
            <stop offset="30%" stopColor="#8fbfe0" />
            <stop offset="60%" stopColor="#3d75ad" />
            <stop offset="100%" stopColor="#122840" />
          </radialGradient>
          <radialGradient id="globe-atmosphere" cx="50%" cy="50%" r="52%">
            <stop offset="88%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="97%" stopColor="#bcdcf0" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#bcdcf0" stopOpacity="0" />
          </radialGradient>
          <clipPath id="globe-clip">
            <circle cx="200" cy="200" r="192" />
          </clipPath>
        </defs>

        <circle cx="200" cy="200" r="196" fill="url(#globe-atmosphere)" />
        <circle cx="200" cy="200" r="192" fill="url(#globe-sphere)" />

        <g clipPath="url(#globe-clip)">
          {/* Layered, irregular landmasses in a few tones — texture over
              precise geography, since this is decorative, not a map. */}
          <path d="M70 150 Q95 110 140 118 Q180 122 178 158 Q182 190 148 205 Q108 215 82 190 Q58 175 70 150Z" fill="#7fa15f" opacity="0.9" />
          <path d="M90 165 Q115 150 140 160 Q150 180 128 192 Q100 198 92 182 Q86 172 90 165Z" fill="#9fbb78" opacity="0.7" />
          <path d="M210 90 Q250 72 288 95 Q310 120 296 150 Q270 168 240 155 Q212 140 205 112 Q204 98 210 90Z" fill="#7fa15f" opacity="0.9" />
          <path d="M235 100 Q262 95 278 112 Q280 132 258 138 Q238 132 232 116 Q231 106 235 100Z" fill="#c7b98a" opacity="0.7" />
          <path d="M120 235 Q155 222 180 245 Q192 275 165 295 Q130 305 112 280 Q102 255 120 235Z" fill="#93b16b" opacity="0.85" />
          <path d="M260 220 Q295 212 315 235 Q320 260 292 270 Q262 268 255 244 Q253 230 260 220Z" fill="#a7c184" opacity="0.8" />
          <path d="M40 240 Q65 228 82 248 Q86 268 62 274 Q40 270 36 254 Q35 246 40 240Z" fill="#9fbb78" opacity="0.6" />
          <path d="M300 60 Q325 52 340 72 Q342 92 318 96 Q298 90 296 74 Q296 66 300 60Z" fill="#7fa15f" opacity="0.7" />
        </g>

        {/* Soft cloud wisps, low-opacity white blobs, no hard edges. */}
        <g clipPath="url(#globe-clip)" opacity="0.35">
          <ellipse cx="150" cy="130" rx="60" ry="14" fill="#ffffff" />
          <ellipse cx="260" cy="180" rx="70" ry="16" fill="#ffffff" />
          <ellipse cx="110" cy="230" rx="50" ry="12" fill="#ffffff" />
        </g>

        <circle cx="200" cy="200" r="192" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="2" />
      </svg>
    </div>
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

      {/* Cropped short of the sphere's full height — only the top curve
          shows, like a close-up photo cut off by the section's own
          bottom edge, the way the reference's globe sinks out of frame. */}
      <div className="relative mx-auto mt-14 h-56 max-w-3xl overflow-hidden sm:h-72 md:h-80">
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
