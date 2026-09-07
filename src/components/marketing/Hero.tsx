import Link from "next/link";
import { ArrowRight } from "lucide-react";

import HeroProtagonista from "./HeroProtagonista";

export default function Hero() {
  return (
    // Fondo claro y plano en vez del degradado azul que había. Además de
    // ser lo que pide la composición, resuelve solo el problema de fondo
    // de los renders: se funden por multiplicación, y sobre el azul el
    // personaje se teñía de azul y se perdía contra él. Contra un color
    // plano y claro desaparece el recuadro y el muñeco se ve tal cual.
    <section className="relative flex min-h-[92vh] flex-col overflow-hidden bg-[var(--background)] pb-10 pt-24 sm:min-h-[100vh] sm:block sm:pb-0 sm:pt-0">      {/* El personaje, enorme y cortado por el borde. Cortarlo es lo que
          lo hace grande de verdad: un cuerpo entero centrado siempre se
          lee pequeño porque tiene que caber, y la mitad del espacio se le
          va en aire alrededor.

          Va detrás del texto en el orden del DOM, no con z-index: un
          elemento posicionado con z-index crea contexto de apilamiento y
          aísla el mix-blend, y el fondo blanco del render se queda blanco
          — un rectángulo recortado sobre la página. */}
      <div className="relative order-2 mx-auto flex w-full max-w-6xl flex-1 items-center px-6 sm:order-none sm:min-h-screen">
        <div className="w-full max-w-xl">
          {/* Una línea corta y versalitas en vez de la píldora oscura de
              antes: el "BETA" ya vive en la barra de arriba, y repetirlo
              aquí era decir dos veces lo mismo a treinta píxeles de
              distancia. */}
          <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:text-[11px]">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            Agentes de IA para negocios en México
          </p>

          <h1 className="mt-5 text-balance text-5xl font-semibold leading-[1.02] tracking-tight text-zinc-950 sm:text-6xl lg:text-7xl">
            Tu negocio publica solo.
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-600 sm:text-lg">
            Siete agentes de IA lo hacen. Tú solo apruebas.
          </p>

          {/* Un solo botón. El "Cómo funciona" que lo acompañaba mandaba a
              una sección que está a un scroll de distancia y le quitaba
              peso al único clic que importa aquí. */}
          <Link
            href="/registro"
            className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
          >
            Únete a la beta
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>

          {/* Las dos objeciones que frenan a alguien en la orilla, juntas
              en un renglón. Ambas son ciertas hoy: el registro solo pide
              correo y contraseña, y el cuestionario de onboarding es el
              mismo de diez minutos que promete la sección de cierre. */}
          <p className="mt-4 text-xs text-zinc-500">
            Sin tarjeta de crédito · Onboarding de 10 minutos
          </p>
        </div>
      </div>

      {/* Arriba en celular y a la derecha desde tablet.

          Arriba porque abajo se lo comía el pliegue: quedaba a media
          pantalla de distancia del titular y había que hacer scroll para
          verlo entero. Primero el personaje y después el texto también
          hace que lo primero que se ve al abrir sea la marca.

          En escritorio se va al borde derecho, cortado a propósito: un
          cuerpo entero centrado siempre se lee pequeño, porque tiene que
          caber y la mitad del espacio se le va en aire alrededor. */}
      <HeroProtagonista className="pointer-events-none order-1 mx-auto aspect-[613/850] h-[42vh] max-h-[380px] shrink-0 sm:absolute sm:bottom-0 sm:-right-8 sm:order-none sm:mx-0 sm:h-[78%] sm:max-h-none lg:right-0 lg:h-[94%]" />
    </section>
  );
}
