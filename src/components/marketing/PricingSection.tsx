"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

import { MENSAJE_COTIZACION, WHATSAPP_VISIBLE } from "@/lib/contacto";
import { SalidaWhatsapp } from "./SalidaWhatsapp";

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
  /** La oferta de arranque, solo en Entrada. Se aplica a mano al cerrar
   * el trato: `grantBetaTrial` (src/app/onboarding/actions.ts) regala el
   * primer mes completo, pero solo corre al terminar el cuestionario de
   * autoservicio, y quien contrata el servicio nunca pasa por ahí. El
   * comentario anterior decía "primer mes gratis, automático" y las dos
   * mitades eran falsas para el cliente de la agencia. */
  trialBadge?: string;
  features: string[];
}

// Los tres paquetes de la agencia, en pesos.
//
// Los precios NO salen de compararse con agencias de humanos. Ese fue el
// error de la primera versión: anclar en "60% de lo que cobra una agencia"
// sigue siendo anclar en una agencia, e invita justo a la comparación que
// Frames pierde — un reel grabado en el gimnasio con gente de verdad tiene
// algo que el generado no.
//
// El rango sale de contra qué compara de verdad un dueño de negocio en
// México cuando lo que le ofrecen es contenido producido con IA:
//
//     No hacer nada                              $0
//     Una herramienta de IA que él opera         $400 – 900
//     Community manager freelance              $4,000 – 8,000
//     Agencia chica                            $8,000 – 15,000
//
// Frames vive entre la herramienta y el freelance: más volumen que un CM,
// cero trabajo para el cliente, pero contenido generado. Por eso el
// paquete de en medio queda en $4,490 y no en los $8,900 de antes.
//
// Lo que sostiene el margen no es el precio, es el costo: la generación
// del paquete de en medio cuesta ~$450 MXN (8 videos × 15 s × $0.168 USD,
// más centavos de imagen), o sea el 10% del ingreso. El costo real sigue
// siendo el tiempo de revisión, que es lo que limita cuántos clientes
// caben — no el precio.
//
// El número de piezas está calculado sobre TU tiempo, no sobre lo que la
// IA puede producir: un video hay que verlo completo para juzgarlo (60 a
// 90 segundos) y una imagen se juzga en tres. Por eso los paquetes suben
// principalmente en video —4, 8, 16— y las imágenes acompañan. Un paquete
// de 15 videos se ve bien en la página y te cuesta el doble de horas que
// uno de 8 con más imagen.
//
// Y por lo mismo la imagen sube libremente con el paquete: cuesta centavos
// de generación y tres segundos de revisión. Que Completo tuviera MENOS
// imágenes que Crecimiento —8 contra 12— era un error heredado de los
// topes de la tabla, no una decisión: pagabas más y recibías menos.
//
// Las redes sociales YA NO diferencian paquetes: los tres traen las tres.
// Antes Entrada daba una sola red, y eso era cobrar por algo que no nos
// cuesta — publicar en tres cuentas en lugar de una es el mismo trabajo.
// Feedbird, que es el competidor más cercano y tiene veinte mil clientes,
// cobra igual por una red que por siete. Lo único que varía entre paquetes
// es el VIDEO, que es lo caro de generar y lo lento de revisar.
//
// Contestar comentarios salió de los paquetes y pasó a ser un agregado:
// es lo único de la lista que cuesta tiempo humano todos los días en vez
// de créditos de generación, así que tiene que cobrarse aparte o se come
// las horas que sostienen todo lo demás.
//
// Los topes de la tabla `plans` se quedan como están y a propósito quedan
// POR ENCIMA de lo que se promete aquí: cada regeneración cuenta contra el
// tope, así que si el tope fuera igual a lo prometido, la primera pieza
// que mandes a rehacer te dejaría sin cupo.
const plans: PricingPlan[] = [
  {
    name: "Entrada",
    price: 2490,
    tagline: "Para que el perfil deje de verse abandonado",
    featured: false,
    trialBadge: "Primer mes a mitad",
    features: [
      "4 videos de tu producto al mes",
      "10 escenas o carruseles al mes",
      "Instagram, Facebook y TikTok",
      "Nosotros publicamos por ti",
    ],
  },
  {
    name: "Crecimiento",
    price: 4490,
    tagline: "Algo nuevo cuatro veces por semana",
    featured: true,
    features: [
      "8 videos de tu producto al mes",
      "12 escenas o carruseles al mes",
      "Instagram, Facebook y TikTok",
      "Publicamos a la hora que le sirve a tu marca",
      "Variantes del mismo producto para probar cuál funciona mejor",
    ],
  },
  {
    name: "Completo",
    price: 7900,
    tagline: "Para cuando el video ya es lo que vende",
    featured: false,
    features: [
      "16 videos de tu producto al mes, de mayor duración",
      "20 escenas o carruseles al mes",
      "Instagram, Facebook y TikTok",
      "Tu contenido se produce primero que el de nadie más",
      "Reporte mensual de resultados",
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
          <span className="text-2xl font-semibold tracking-tight md:text-4xl">
            ${plan.price.toLocaleString("es-MX")}
          </span>
          <span className={`text-sm ${plan.featured ? "text-zinc-400" : "text-zinc-500"}`}>MXN/mes</span>
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
          {/* Decía "Elige tu plan y publica tu primer contenido hoy",
              que promete autoservicio: no hay dónde elegir plan ni nada
              que se publique hoy — el botón de abajo abre una propuesta.
              Un encabezado que promete más que el botón que lo acompaña
              es la forma más barata de perder la confianza. */}
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Elige cuánto video quieres al mes
          </h2>
          <p className="mt-4 text-zinc-600">
            Las tres redes vienen en los tres paquetes. Lo que cambia es cuánto
            video sale al mes, que es la parte cara.
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
        <p className="mt-2 text-center text-xs text-zinc-400 sm:hidden">Desliza para ver los 3 paquetes →</p>

        {/* El agregado, fuera de las tarjetas a propósito: si viviera dentro
            de una de las tres, volvería a parecer que es lo que separa un
            paquete de otro. */}
        <p className="mx-auto mt-6 max-w-lg text-center text-sm text-zinc-600">
          ¿Quieres que también contestemos comentarios y mensajes? Eso se agrega aparte.
        </p>

        {/* La salida de WhatsApp, debajo de los planes y no arriba. Quien
            llegó hasta aquí ya comparó y tiene una duda concreta —"¿me
            sirve el Pro o el Max?", "¿y si solo quiero Instagram?"—, y esa
            plática se cierra en un chat, no llenando un formulario. */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-center text-sm text-zinc-600">
            ¿No sabes cuál? Dime qué vendes y te armo una cotización.
          </p>
          <SalidaWhatsapp
            mensaje={MENSAJE_COTIZACION}
            boton="cotizacion"
            className="inline-flex items-center gap-2 rounded-full bg-[image:var(--plastico)] px-6 py-3 text-sm font-medium text-zinc-900 shadow-[var(--relieve-pieza)] transition-all hover:brightness-[1.02] active:translate-y-px"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
            Pedir cotización por WhatsApp
          </SalidaWhatsapp>
          <p className="text-xs text-zinc-500">{WHATSAPP_VISIBLE}</p>
        </div>

        <p className="mt-8 text-center text-xs text-zinc-500">
          Precios en pesos, más IVA. Sin contratos forzosos y sin letra chica:
          cancelas cuando quieras. El presupuesto de anuncios, si decides
          pautar, va aparte.
        </p>
      </div>
    </section>
  );
}
