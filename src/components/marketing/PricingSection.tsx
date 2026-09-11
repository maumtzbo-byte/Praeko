"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

import { ligaWhatsapp, MENSAJE_COTIZACION, WHATSAPP_VISIBLE } from "@/lib/contacto";

// Feature copy leads with what each line means for the owner reading it —
// not the AI provider/model behind it (nobody running a cafetería cares
// what "Kling 3.0 Pro" is) — while keeping every real number and limit
// exactly as it is in the plans table, so nothing here overstates what the
// plan actually includes.
interface PricingPlan {
  name: string;
  price: number;
  tagline: string;
  featured: boolean;
  /** Beta launch offer, Básico only: the first month is free, granted
   * automatically the moment onboarding finishes (see grantBetaTrial in
   * src/app/onboarding/actions.ts) — no card, no waiting on a human. */
  trialBadge?: string;
  features: string[];
}

const plans: PricingPlan[] = [
  {
    name: "Básico",
    price: 99,
    tagline: "Para arrancar a publicar cada semana, sin complicarte",
    featured: false,
    trialBadge: "Primer mes a mitad",
    features: [
      "8 videos al mes, de 10 segundos con audio, listos para subir",
      "22 imágenes o carruseles al mes",
      "Video generado con IA de calidad profesional",
      "1 red social conectada (Instagram)",
      "Sin subtítulos automáticos",
    ],
  },
  {
    name: "Pro",
    price: 199,
    tagline: "Algo nuevo casi todos los días, en tus tres redes",
    featured: true,
    features: [
      "15 videos al mes, con la duración justa para cada pieza (hasta 25s)",
      "15 imágenes o carruseles al mes",
      "Video con calidad profesional y subtítulos automáticos incluidos",
      "3 redes sociales conectadas (Instagram, Facebook y TikTok)",
      "Publicamos con el horario recomendado para tu tipo de negocio, y ves tus resultados reales en tu panel",
    ],
  },
  {
    name: "Max",
    price: 399,
    tagline: "Para negocios que quieren estar en todos lados, sin esperar",
    featured: false,
    features: [
      "22 videos al mes, hasta 30 segundos cada uno",
      "8 imágenes o carruseles al mes",
      "La mejor calidad de video que ofrecemos, con subtítulos automáticos",
      "3 redes sociales conectadas (Instagram, Facebook y TikTok)",
      "Tu contenido se procesa primero que el de nadie más, con soporte dedicado y sin marca de agua",
    ],
  },
];

type Plan = PricingPlan;

function PricingCard({
  plan,
  index,
  isMobileActive,
  registerRef,
}: {
  plan: Plan;
  index: number;
  isMobileActive: boolean;
  registerRef: (index: number, el: HTMLDivElement | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const popped = hovered || isMobileActive;

  // "Popping" (hover on desktop, or being the centered card in the mobile
  // snap-carousel) lifts the card a bit further and tilts it toward the
  // pointer. Kept on this inner element, separate from the outer wrapper's
  // static md:-translate-y-3 (the featured card's permanent desktop-only
  // elevation) — both set `transform`, so on one element the dynamic pop
  // would silently overwrite the static lift every frame.
  const y = popped ? -10 : 0;

  return (
    <div
      ref={(el) => registerRef(index, el)}
      data-index={index}
      className={`relative w-[82%] shrink-0 snap-center sm:w-auto sm:shrink ${plan.featured ? "md:-translate-y-3" : ""}`}
    >
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{ y, scale: popped ? 1.02 : 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className={`relative flex h-full w-full flex-col rounded-2xl border p-5 transition-colors duration-300 md:rounded-3xl md:p-8 ${
          plan.featured
            ? "border-accent bg-zinc-950 text-white"
            : "border-[var(--hairline)] bg-[var(--background)] text-zinc-950"
        }`}
      >
        {/* "RECOMENDADO" y no "MÁS POPULAR": lo segundo dice que otros
            clientes ya lo eligieron, y en beta eso no se puede sostener.
            Esto es una recomendación nuestra, que sí podemos defender. */}
        {plan.featured && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-1 text-[11px] font-semibold tracking-wide text-white">
            RECOMENDADO
          </span>
        )}

        <h3 className="text-base font-semibold md:text-lg">{plan.name}</h3>
        <p className={`mt-1 text-sm ${plan.featured ? "text-zinc-400" : "text-zinc-500"}`}>{plan.tagline}</p>

        <div className="mt-6 flex items-baseline gap-1">
          <span className="text-2xl font-semibold tracking-tight md:text-4xl">${plan.price}</span>
          <span className={`text-sm ${plan.featured ? "text-zinc-400" : "text-zinc-500"}`}>/mes</span>
        </div>
        {plan.trialBadge && (
          <span className="mt-2 inline-flex w-fit items-center rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent">
            {plan.trialBadge}
          </span>
        )}

        <ul className="mt-8 flex flex-1 flex-col gap-3">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.featured ? "text-accent" : "text-zinc-500"}`} />
              <span className={plan.featured ? "text-zinc-300" : "text-zinc-600"}>{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          // A /prueba y no a /registro con el plan preseleccionado: no hay
          // autoservicio que entregar mientras Meta siga bloqueado, y un
          // servicio se cierra hablando. El plan que le interese se
          // conversa en WhatsApp, que es donde de todos modos se decide.
          href="/prueba"
          className={`mt-8 rounded-full px-5 py-2.5 text-center text-sm font-medium transition-opacity hover:opacity-90 ${
            plan.featured ? "bg-accent text-white" : "bg-zinc-950 text-white "
          }`}
        >
          {/* "Solicitar propuesta" y no "Elegir plan": el botón ya no
              contrata nada, abre una conversación. Prometer que eliges y
              ya, para luego mandar un formulario, es la forma más rápida
              de perder la confianza en el primer clic. */}
          Solicitar propuesta
        </Link>
      </motion.div>
    </div>
  );
}

export default function PricingSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Mirrors the sm: breakpoint the layout itself switches on (grid vs.
  // snap-carousel) — the "centered card pops out" behavior only makes
  // sense while it's actually a one-at-a-time carousel.
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobileLayout(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!isMobileLayout || !containerRef.current) {
      setActiveIndex(null);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex: number | null = null;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = Number((entry.target as HTMLElement).dataset.index);
          }
        }
        if (bestIndex !== null && bestRatio > 0.5) setActiveIndex(bestIndex);
      },
      { root: containerRef.current, threshold: [0, 0.25, 0.5, 0.75, 0.9, 1] },
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [isMobileLayout]);

  function registerCardRef(index: number, el: HTMLDivElement | null) {
    cardRefs.current[index] = el;
  }

  return (
    <section id="precios" className="relative py-16 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">
            PLANES
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Elige tu plan y publica tu primer contenido hoy
          </h2>
          <p className="mt-4 text-zinc-600">
            Precios en dólares y un límite claro cada mes. Sabes desde el
            primer día cuánto vas a pagar.
          </p>
        </div>

        {/* Mobile: a swipeable, one-card-at-a-time carousel with each card
            at full comfortable size — cramming all 3 into equal thirds of
            a phone screen read as cramped no matter how far the type was
            shrunk. Snap-scroll instead, same card sizing as tablet/desktop.
            pt-8 gives room for the "RECOMENDADO" badge (pokes -top-3 above
            the card) plus the pop lift (-10px) it can get when centered —
            overflow-x-auto here also computes overflow-y as clipping, so
            without enough padding the badge's top got cut off by the
            scroll container's own box. */}
        <div
          ref={containerRef}
          className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 pt-8 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 sm:pt-0 md:gap-6"
        >
          {plans.map((plan, index) => (
            <PricingCard
              key={plan.name}
              plan={plan}
              index={index}
              isMobileActive={isMobileLayout && activeIndex === index}
              registerRef={registerCardRef}
            />
          ))}
        </div>
        <p className="mt-2 text-center text-xs text-zinc-400 sm:hidden">Desliza para ver los 3 planes →</p>

        {/* La salida de WhatsApp, debajo de los planes y no arriba. Quien
            llegó hasta aquí ya comparó y tiene una duda concreta —"¿me
            sirve el Pro o el Max?", "¿y si solo quiero Instagram?"—, y esa
            plática se cierra en un chat, no llenando un formulario. */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-center text-sm text-zinc-600">
            ¿No sabes cuál te conviene? Te armo una cotización con lo que sí necesitas.
          </p>
          <a
            href={ligaWhatsapp(MENSAJE_COTIZACION)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[image:var(--plastico)] px-6 py-3 text-sm font-medium text-zinc-900 shadow-[var(--relieve-pieza)] transition-all hover:brightness-[1.02] active:translate-y-px"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
            Pedir cotización por WhatsApp
          </a>
          <p className="text-xs text-zinc-500">{WHATSAPP_VISIBLE}</p>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Equivalente informativo en MXN al tipo de cambio del día. Sin
          contratos forzosos y sin letra chica. Cancelas cuando quieras.
        </p>
      </div>
    </section>
  );
}
