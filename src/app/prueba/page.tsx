import { Suspense } from "react";
import type { Metadata } from "next";

import { FramesMark } from "@/components/brand/FramesMark";
import { LeadForm } from "@/components/marketing/LeadForm";
import { MENSAJE_COTIZACION } from "@/lib/contacto";
import { SalidaWhatsapp } from "@/components/marketing/SalidaWhatsapp";

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
  title: "Video y escenas de tu producto | Frames",
  description:
    "Convertimos las fotos que ya tienes de tu producto en video y escenas nuevas, y las publicamos. Pide tres piezas de muestra sin costo.",
  // Es una página de campaña: no tiene por qué competir en buscadores con
  // la portada ni acumular versiones indexadas por cada parámetro de
  // origen que traiga un anuncio.
  robots: { index: false, follow: false },
};

/**
 * Lo que recibes al mes, en números y no en íconos.
 *
 * Antes eran cuatro renglones con un icono de línea de lucide cada uno:
 * una claqueta, un cuadrito de imagen, un avioncito de papel, una
 * burbujita. Son los mismos íconos que trae cualquier plantilla, y por eso
 * la página se leía a plantilla — el problema no era el dibujo, era que no
 * era nuestro.
 *
 * Lo que sí es nuestro son dos cosas: la tipografía y el plástico mate del
 * resto del sitio. Así que el renglón lo encabeza el número, grande, en
 * una pastilla del mismo material. No hace falta encargar ilustraciones ni
 * generar nada: un 8 bien puesto dice más que una claqueta genérica, y de
 * paso baja de cuatro renglones a tres.
 *
 * El cuarto —"hechas con las fotos que ya tienes"— se subió al párrafo de
 * arriba, que es donde de verdad contesta la duda.
 */
const RECIBES = [
  { cifra: "8", texto: "videos de tu producto al mes, con audio" },
  { cifra: "12", texto: "escenas o carruseles" },
  { cifra: "3", texto: "redes: Instagram, Facebook y TikTok" },
];

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
                PARA MARCAS MEXICANAS
              </p>
              <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.02] tracking-tight text-zinc-950 sm:text-5xl">
                Mándame una foto. Mañana tienes tres piezas.
              </h1>
              <p className="mt-4 max-w-sm text-[17px] leading-relaxed text-zinc-600">
                Con la foto que ya tienes. Sin costo.
              </p>
            </div>

            <ul className="flex flex-col gap-3">
              {RECIBES.map(({ cifra, texto }) => (
                <li key={cifra} className="flex items-center gap-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[image:var(--plastico)] text-lg font-semibold tabular-nums tracking-tight text-zinc-950 shadow-[var(--relieve-pieza)]">
                    {cifra}
                  </span>
                  <span className="text-[15px] leading-snug text-zinc-800">{texto}</span>
                </li>
              ))}
            </ul>

            {/* Se fueron las dos pastillas de "Sin agendar sesión · Sin
                aprender nada" y la letra chica del presupuesto de anuncios.
                Un aterrizaje de anuncio no se gana agregando argumentos: se
                gana quitando todo lo que retrasa el momento de llenar el
                formulario. Lo de la pauta se platica cuando ya contestó. */}
            <p className="text-[15px] text-zinc-600">
              <span className="text-xl font-semibold tracking-tight text-zinc-950">
                Desde $2,490 al mes.
              </span>{" "}
              Sin contratos.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-balance text-2xl font-semibold tracking-tight text-zinc-950">
                Dime dónde te las mando
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
                Llegan a tu WhatsApp mañana.
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
            <SalidaWhatsapp
              mensaje={MENSAJE_COTIZACION}
              boton="cotizacion"
              className="rounded-full bg-[image:var(--plastico)] px-5 py-3 text-center text-sm font-medium text-zinc-800 shadow-[var(--relieve-pieza)] transition-all hover:brightness-[1.02] active:translate-y-px"
            >
              O pide tu cotización por WhatsApp
            </SalidaWhatsapp>
          </div>
        </div>

        {/* La objeción, no el argumento de venta. Nadie compra "siete
            agentes de IA"; la gente compra que sus redes estén resueltas.
            Pero al ver 20 piezas por ese precio, la primera pregunta es
            "¿cómo le hacen?", y esto la contesta. */}
        <section className="mt-16 border-t border-[var(--hairline)] pt-10 sm:mt-20">
          <h2 className="max-w-lg text-balance text-2xl font-semibold tracking-tight text-zinc-950">
            ¿Y mi etiqueta?
          </h2>
          {/* Un párrafo, no dos. La duda de la etiqueta se contesta en una
              frase; el segundo párrafo explicaba lo mismo con otra metáfora
              y en un aterrizaje de anuncio eso es texto que se salta. */}
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-zinc-600">
            Sale igual. Tu foto entra con su forma, su color y su nombre al frente, y así se queda.
            Lo que armamos alrededor es la mesa, la luz y la mano que lo levanta.
          </p>
        </section>
      </main>

      <footer className="border-t border-[var(--hairline)] px-6 py-8">
        <p className="mx-auto max-w-5xl text-xs text-zinc-500">
          Frames · Video y escenas de producto para marcas mexicanas
        </p>
      </footer>
    </div>
  );
}
