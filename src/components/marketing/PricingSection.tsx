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

        <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border p-2.5 transition-all duration-300 sm:rounded-2xl sm:p-5 md:rounded-3xl md:p-8 ${
                plan.featured
                  ? "border-zinc-900 bg-zinc-950 text-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] sm:-translate-y-2 sm:hover:-translate-y-3 md:-translate-y-3 md:hover:-translate-y-4 hover:shadow-[0_28px_70px_-15px_rgba(0,0,0,0.5)]"
                  : "border-[var(--hairline)] bg-white/60 text-zinc-950 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_36px_-22px_rgba(0,0,0,0.18)] hover:-translate-y-1.5 hover:shadow-[0_28px_54px_-20px_rgba(0,0,0,0.22)]"
              }`}
            >
              {plan.featured && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-1.5 py-0.5 text-[7px] font-semibold tracking-wide text-zinc-900 shadow sm:-top-3 sm:px-3 sm:py-1 sm:text-[11px]">
                  MÁS POPULAR
                </span>
              )}

              <h3 className="text-xs font-semibold sm:text-base md:text-lg">{plan.name}</h3>
              <p
                className={`mt-1 hidden text-sm sm:block ${
                  plan.featured ? "text-zinc-400" : "text-zinc-500"
                }`}
              >
                {plan.tagline}
              </p>

              <div className="mt-2 flex items-baseline gap-0.5 sm:mt-6 sm:gap-1">
                <span className="text-base font-semibold tracking-tight sm:text-2xl md:text-4xl">
                  ${plan.price}
                </span>
                <span
                  className={`text-[9px] sm:text-sm ${
                    plan.featured ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  /mes
                </span>
              </div>

              <ul className="mt-3 flex flex-1 flex-col gap-1.5 sm:mt-8 sm:gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-1 text-[9px] leading-tight sm:gap-2 sm:text-sm sm:leading-normal">
                    <Check
                      className={`mt-0.5 h-2.5 w-2.5 shrink-0 sm:h-4 sm:w-4 ${
                        plan.featured ? "text-zinc-300" : "text-zinc-500"
                      }`}
                    />
                    <span
                      className={plan.featured ? "text-zinc-300" : "text-zinc-600"}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={`/registro?plan=${plan.name.toLowerCase()}`}
                className={`mt-3 rounded-full px-2 py-1.5 text-center text-[10px] font-medium transition-transform hover:scale-[1.02] sm:mt-8 sm:px-5 sm:py-2.5 sm:text-sm ${
                  plan.featured
                    ? "bg-white text-zinc-950"
                    : "bg-zinc-950 text-white"
                }`}
              >
                Elegir
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Equivalente informativo en MXN al tipo de cambio del día. Suscripción
          recurrente vía Stripe, cancela cuando quieras.
        </p>
      </div>
    </section>
  );
}
