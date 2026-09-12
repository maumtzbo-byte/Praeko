"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Real numbers only, nothing invented to look like traction Frames
// doesn't have yet. "20" son las piezas del paquete de en medio, que es el
// que se anuncia (8 videos + 12 imágenes; ver PricingSection),
// "100%" is the product's actual language, and "7" is the number of
// agents actually listed further down this same page (see
// TeamSection.tsx) — no fabricated user/customer count. This said "5"
// while that section listed five; the Revisor de Marca and the Agente de
// Tendencias were already shipped and simply weren't being counted.
// Los tres siguen siendo números verificables, nada inventado para
// parecer tracción. Cambia el primero: "100% contenido en español" era
// cierto pero no le resolvía nada a una marca de producto, y "0 sesiones
// de fotos" sí — es justo el gasto y la agenda que le quitas.
const SUPPORTING_STATS = [
  { value: "0", label: "Sesiones de fotos que tengas que agendar" },
  { value: "20", label: "Piezas nuevas de tu producto al mes" },
  { value: "7", label: "Agentes de IA trabajando en tu marca" },
];

export default function StatsShowcase() {
  /** El globo no se baja hasta que se acerca a la pantalla.
   *
   *  Medido: la portada se traía 1,463 KB antes de que nadie hiciera
   *  scroll, y 636 de esos eran este video — el 43% del peso de la página
   *  gastado en algo que vive cuatro pantallas abajo. La culpa era de
   *  `preload="auto"` junto a `autoPlay`, que le dice al navegador que lo
   *  descargue completo de inmediato.
   *
   *  Los `<source>` no se pintan hasta entonces, porque quitar el preload
   *  no basta: con el src puesto, el navegador igual se adelanta.
   *
   *  300 px de margen para que empiece a bajar antes de entrar, y que
   *  cuando llegue ya esté rodando en vez de aparecer en negro. */
  const referencia = useRef<HTMLVideoElement>(null);
  const [cerca, setCerca] = useState(false);

  useEffect(() => {
    const nodo = referencia.current;
    if (!nodo || cerca) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setCerca(true);
          observador.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [cerca]);

  // Los <source> aparecen después del primer pintado, y un <video> que ya
  // existía no los mira solo: hay que pedirle que vuelva a buscar.
  useEffect(() => {
    if (cerca) referencia.current?.load();
  }, [cerca]);

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        {/* Fuera el distintivo de "Beta abierta" y el "sé de los
            primeros". Anunciar que estás en beta es normal en software y
            es veneno en un servicio: quien va a pagar por que le lleven
            sus redes no quiere ser el conejillo de indias de nadie. El
            trabajo se entrega igual de terminado hoy que dentro de un
            año; lo que sigue puliéndose es la herramienta, y eso es
            asunto nuestro, no suyo. */}
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Veinte piezas al mes y cero sesiones de fotos
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-zinc-600 sm:text-base">
          Todo sale de las fotos que ya tienes. Siete agentes de IA arman el mes y una persona
          revisa cada pieza antes de que tú la veas.
        </p>
        <Link
          href="/prueba"
          className="mt-6 inline-flex rounded-full bg-zinc-950 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Quiero ver una muestra
        </Link>
      </div>

      {/* The real reference clip, not a re-built 3D scene — a rotating
          globe render already cropped to a clean hemisphere at the
          source. The footage has a baked-in near-white background
          (#fdfdfd, no alpha channel) — mix-blend-mode: multiply is what
          makes that read as "no background" instead of a card: multiplying
          white by the page's own light gray returns that same gray, so
          the video's background pixels disappear into the page while the
          globe's actual (darker) colors stay visible, just a hair
          deeper. Only works because the page is a fixed light color now
          that dark mode is gone — multiply against a dark background
          would have crushed the whole video to black. Sized off the
          source crop's own aspect ratio (650:368) so it's never
          letterboxed or cut off, on phone or desktop alike. */}
      <div className="mx-auto mt-14 max-w-md px-6 sm:max-w-lg md:max-w-2xl">
        <video
          ref={referencia}
          className="block w-full mix-blend-multiply"
          style={{
            aspectRatio: "650 / 368",
            // The source clip cuts the sphere off flat at the bottom of
            // the frame — this mask fades that hard line to transparent
            // instead, so the globe reads as dissolving into the page
            // rather than being sliced by a rectangle.
            maskImage: "linear-gradient(to bottom, black 0%, black 78%, transparent 97%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 78%, transparent 97%)",
          }}
          autoPlay
          loop
          muted
          playsInline
          preload="none"
        >
          {/* webm first: smaller, and it's the one format guaranteed
              present in every Chromium build without a licensed H.264
              decoder. mp4 covers Safari, which never plays webm.

              Envueltos en la condición: sin src no hay nada que bajar, que
              es el punto. El hueco no se mueve mientras tanto porque el
              `aspectRatio` de arriba ya reservó su espacio. */}
          {cerca && (
            <>
              <source src="/videos/earth-globe.webm" type="video/webm" />
              <source src="/videos/earth-globe.mp4" type="video/mp4" />
            </>
          )}
        </video>
      </div>

      {/* Always 3 across, even on phones — stacked, these ate a whole
          screen of vertical space for three short numbers. Sized up for
          impact, not just legibility — these are meant to land the same
          way the headline figure does, not read as fine print under it. */}
      <div className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-3 px-6 text-center sm:gap-8">
        {SUPPORTING_STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
          >
            <p className="text-3xl font-semibold tracking-tight text-accent sm:text-5xl">{stat.value}</p>
            <p className="mt-1 text-xs leading-tight text-zinc-500 sm:text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
