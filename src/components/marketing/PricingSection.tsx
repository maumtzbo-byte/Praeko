import Link from "next/link";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Básico",
    price: 99,
    tagline: "Más imagen, video semilla diaria",
    featured: false,
    features: [
      "8 videos/mes · 10s fijos, con audio",
      "22 imágenes o carruseles/mes",
      "Generación con Kling 3.0 Pro",
      "1 red social (Instagram)",
      "Sin subtítulos quemados",
    ],
  },
  {
    name: "Pro",
    price: 199,
    tagline: "Equilibrio 50/50 para publicación diaria",
    featured: true,
    features: [
      "15 videos/mes · duración variable (promedio 15s, tope 25s)",
      "15 imágenes o carruseles/mes",
      "Generación con Kling 3.0 Pro + subtítulos quemados",
      "3 redes sociales (Instagram, Facebook, TikTok)",
      "Horario optimizado con datos reales + dashboard de analíticas",
    ],
  },
  {
    name: "Max",
    price: 399,
    tagline: "Máximo rendimiento audiovisual",
    featured: false,
    features: [
      "22 videos/mes · duración variable (promedio 20s, tope 30s)",
      "8 imágenes o carruseles/mes",
      "Generación con Seedance 2.0 Standard 720p + subtítulos",
      "3 redes sociales (Instagram, Facebook, TikTok)",
      "Prioridad en cola, soporte dedicado, descargas sin marca de agua",
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="precios" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">
            PLANES
          </p>
          <h2 className="text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Un plan para cada etapa de tu negocio
          </h2>
          <p className="mt-4 text-zinc-600">
            Precios en USD, con límites claros de generación al mes — sin
            sorpresas en tu margen.
          </p>
        </div>

        {/* Mobile: a swipeable, one-card-at-a-time carousel with each card
            at full comfortable size — cramming all 3 into equal thirds of
            a phone screen read as cramped no matter how far the type was
            shrunk. Snap-scroll instead, same card sizing as tablet/desktop. */}
        <div className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 md:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex w-[82%] shrink-0 snap-center flex-col rounded-2xl border p-5 transition-all duration-300 sm:w-auto sm:shrink md:rounded-3xl md:p-8 ${
                plan.featured
                  ? "border-zinc-900 bg-zinc-950 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] md:-translate-y-3 md:hover:-translate-y-4 hover:shadow-[0_28px_70px_-15px_rgba(0,0,0,0.5)]"
                  : "border-[var(--hairline)] bg-white/60 text-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_36px_-22px_rgba(0,0,0,0.18)] hover:-translate-y-1.5 hover:shadow-[0_28px_54px_-20px_rgba(0,0,0,0.22)]"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow">
                  MÁS POPULAR
                </span>
              )}

              <h3 className="text-base font-semibold md:text-lg">{plan.name}</h3>
              <p className={`mt-1 text-sm ${plan.featured ? "text-zinc-400" : "text-zinc-500"}`}>
                {plan.tagline}
              </p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-2xl font-semibold tracking-tight md:text-4xl">${plan.price}</span>
                <span className={`text-sm ${plan.featured ? "text-zinc-400" : "text-zinc-500"}`}>/mes</span>
              </div>

              <ul className="mt-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        plan.featured ? "text-accent" : "text-zinc-500"
                      }`}
                    />
                    <span className={plan.featured ? "text-zinc-300" : "text-zinc-600"}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/registro?plan=${plan.name.toLowerCase()}`}
                className={`mt-8 rounded-full px-5 py-2.5 text-center text-sm font-medium transition-transform hover:scale-[1.02] ${
                  plan.featured ? "bg-accent text-white" : "bg-zinc-950 text-white"
                }`}
              >
                Elegir {plan.name}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-zinc-400 sm:hidden">Desliza para ver los 3 planes →</p>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Equivalente informativo en MXN al tipo de cambio del día. Suscripción
          recurrente vía Stripe, cancela cuando quieras.
        </p>
      </div>
    </section>
  );
}
