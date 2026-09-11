import { Suspense } from "react";
import type { Metadata } from "next";
import { Clapperboard, ImageIcon, MessageCircle, Send } from "lucide-react";

import { FramesMark } from "@/components/brand/FramesMark";
import { LeadForm } from "@/components/marketing/LeadForm";
import { ligaWhatsapp, MENSAJE_COTIZACION } from "@/lib/contacto";

/**
 * Aterrizaje de los anuncios de Meta.
 *
 * Vive aparte de la home a propósito. El anuncio dice "20 piezas al mes" y
 * la página tiene que abrir diciendo lo mismo: mandar tráfico pagado a una
 * portada que habla de otra cosa es la forma más cara de perder un clic.
 *
 * Tres decisiones que la separan de la landing:
 *
 *   · Sin menú y sin enlaces de escape. Un aterrizaje de anuncio tiene un
 *     solo trabajo, y cada enlace que lleva a otro lado es una fuga.
 *   · El formulario va arriba, junto al titular, no al final. En celular
 *     aparece completo sin scroll después del encabezado.
 *   · Un solo precio, "desde". La comparación de los tres planes es una
 *     decisión, y una decisión en un aterrizaje frena la conversión — esa
 *     conversación va en WhatsApp, que es donde de todos modos se cierra.
 */
export const metadata: Metadata = {
  title: "20 piezas al mes para tu negocio | Frames",
  description:
    "Videos e imágenes para Instagram, Facebook y TikTok, publicados por nosotros. Pide tres piezas de muestra sin costo.",
  // Es una página de campaña: no tiene por qué competir en buscadores con
  // la portada ni acumular versiones indexadas por cada parámetro de
  // origen que traiga un anuncio.
  robots: { index: false, follow: false },
};

const RECIBES = [
  { icono: Clapperboard, texto: "8 videos al mes, con audio y subtítulos" },
  { icono: ImageIcon, texto: "12 imágenes o carruseles" },
  { icono: Send, texto: "Publicado en Instagram, Facebook y TikTok" },
  { icono: MessageCircle, texto: "Contestamos comentarios y mensajes" },
];

const NO_HACES = ["No grabas", "No editas", "No escribes", "No programas"];

export default function PruebaPage() {
  return (
    <div className="min-h-svh bg-[var(--background)]">
      {/* El logo no es enlace. En un aterrizaje de anuncio, el logo
          clickeable es la fuga más común: la gente lo toca por costumbre y
          termina en la portada, que es otra conversación. */}
      <header className="mx-auto flex max-w-5xl items-center gap-2 px-6 pt-8">
        <FramesMark className="h-5 w-5 text-zinc-950" />
        <span className="text-base font-semibold tracking-[0.22em] text-zinc-950">FRAMES</span>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-20 pt-8 sm:pt-12">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-14">
          <div className="flex flex-col gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-zinc-500">
                PARA NEGOCIOS EN MÉXICO
              </p>
              <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-zinc-950 sm:text-5xl">
                20 piezas al mes para tu negocio
              </h1>
              <p className="mt-4 max-w-md text-[17px] leading-relaxed text-zinc-600">
                Nosotros armamos el mes completo, lo producimos y lo publicamos en tus redes. Tú
                nada más lo revisas.
              </p>
            </div>

            <ul className="flex flex-col gap-2.5">
              {RECIBES.map(({ icono: Icono, texto }) => (
                <li key={texto} className="flex items-center gap-3 text-[15px] text-zinc-800">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-accent shadow-[var(--relieve-pieza)]">
                    <Icono className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  {texto}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-2">
              {NO_HACES.map((no) => (
                <span
                  key={no}
                  className="rounded-full bg-zinc-100 px-3 py-1.5 text-[13px] font-medium text-zinc-600 shadow-[var(--relieve-hundido)]"
                >
                  {no}
                </span>
              ))}
            </div>

            <p className="text-[15px] text-zinc-600">
              <span className="text-xl font-semibold tracking-tight text-zinc-950">
                Desde $4,900 al mes.
              </span>{" "}
              Sin contratos forzosos. El presupuesto de anuncios, si quieres pautar, va aparte.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-zinc-950">
                Te mando 3 piezas hechas para tu negocio
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
                En menos de 24 horas, sin costo. Las ves y tú decides.
              </p>
            </div>
            {/* useSearchParams necesita un límite de Suspense para que la
                página se pueda prerenderizar; sin él, Next la marca como
                dinámica completa y el primer byte tarda más — justo en la
                página donde cada segundo cuesta prospectos. */}
            <Suspense fallback={<div className="h-[32rem] rounded-3xl bg-zinc-100" />}>
              <LeadForm />
            </Suspense>

            {/* La salida para quien no quiere llenar nada. Un porcentaje
                real de los prospectos en México prefiere escribir directo
                a WhatsApp, y perderlos por no ofrecerles el canal sería
                tirar el clic que ya pagaste. */}
            <a
              href={ligaWhatsapp(MENSAJE_COTIZACION)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[image:var(--plastico)] px-5 py-3 text-center text-sm font-medium text-zinc-800 shadow-[var(--relieve-pieza)] transition-all hover:brightness-[1.02] active:translate-y-px"
            >
              O pide tu cotización por WhatsApp
            </a>
          </div>
        </div>

        {/* La objeción, no el argumento de venta. Nadie compra "siete
            agentes de IA"; la gente compra que sus redes estén resueltas.
            Pero al ver 20 piezas por ese precio, la primera pregunta es
            "¿cómo le hacen?", y esto la contesta. */}
        <section className="mt-16 border-t border-[var(--hairline)] pt-10 sm:mt-20">
          <h2 className="max-w-lg text-balance text-2xl font-semibold tracking-tight text-zinc-950">
            ¿Cómo alcanza para 20 piezas?
          </h2>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600">
            Porque no las hacemos a mano. Siete agentes de IA producen el mes: uno arma el plan, uno
            busca qué está funcionando en tu giro, uno genera los videos y otro los revisa antes de
            que los veas. Nosotros ponemos el criterio y la cara, que es lo que sí importa.
          </p>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-600">
            Una agencia normal necesita un diseñador y un editor para hacer esto, y por eso cobra
            tres veces más. Nosotros no.
          </p>
        </section>
      </main>

      <footer className="border-t border-[var(--hairline)] px-6 py-8">
        <p className="mx-auto max-w-5xl text-xs text-zinc-500">
          Frames · Marketing con agentes de IA para negocios en México
        </p>
      </footer>
    </div>
  );
}
