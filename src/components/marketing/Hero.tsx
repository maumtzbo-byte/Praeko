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
    //
    // `svh` y no `vh` en celular: en iPhone, `100vh` mide la ventana SIN la
    // barra de Safari, así que una sección de 100vh siempre queda más alta
    // que lo que de verdad se ve. `svh` mide la ventana chica —con la barra
    // puesta, que es como se abre la página— y así el hero llena la
    // pantalla exacta sin dejar asomar la sección de abajo.
    <section className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-[var(--background)] pb-6 pt-20 sm:block sm:min-h-[100vh] sm:justify-start sm:pb-0 sm:pt-0">
      {/* El personaje, enorme y cortado por el borde. Cortarlo es lo que
          lo hace grande de verdad: un cuerpo entero centrado siempre se
          lee pequeño porque tiene que caber, y la mitad del espacio se le
          va en aire alrededor.

          Va detrás del texto en el orden del DOM, no con z-index: un
          elemento posicionado con z-index crea contexto de apilamiento y
          aísla el mix-blend, y el fondo blanco del render se queda blanco
          — un rectángulo recortado sobre la página. */}
      {/* En celular el texto va pegado al personaje y el bloque entero se
          centra vertical: dejándolo crecer con flex-1, el titular se iba al
          fondo de la pantalla y quedaba un hueco muerto en medio. Desde
          tablet sí crece, porque ahí el texto y el personaje están uno al
          lado del otro y el centrado vertical es lo correcto. */}
      <div className="relative order-2 mx-auto mt-6 flex w-full max-w-6xl shrink-0 items-center px-6 sm:order-none sm:mt-0 sm:min-h-screen sm:flex-1">
        <div className="flex w-full max-w-xl flex-col items-center text-center sm:items-start sm:text-left">
          {/* Sin "agentes de IA" aquí: la frase de abajo ya los nombra, y
              decirlo dos veces en tres renglones es de las cosas que hacen
              que una portada suene a plantilla. El "BETA" tampoco se
              repite — ya vive en la barra de arriba. */}
          <p className="hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500 sm:flex sm:text-[11px]">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            Para marcas mexicanas que venden por Instagram
          </p>

          {/* Antes: "Tu negocio publica solo." Servía cuando le hablábamos a
              cualquier negocio, y dejó de servir en cuanto el cliente pasó a
              ser una marca de producto: lo que esa persona quiere no es
              publicar, es que su frasco se vea como los de las marcas que
              admira. "Publicar solo" describe el mecanismo; esto describe el
              resultado, que es lo que se compra. */}
          <h1 className="text-balance text-[2.7rem] font-semibold leading-[1.0] tracking-tight text-zinc-950 sm:mt-5 sm:text-6xl lg:text-7xl">
            Tu producto merece algo mejor que un fondo blanco.
          </h1>

          {/* Verbos concretos en vez de "lo hacen": arman, hacen, suben.
              Y el remate se sale de la simetría — "Siete agentes de IA lo
              hacen. Tú solo apruebas." eran dos mitades calcadas, que es
              como escribe una máquina y no como habla alguien. "Dices que
              sí" también es lo que de verdad diría el dueño de un
              changarro; "apruebas" es lenguaje de oficina corporativa. */}
          <p className="mt-5 hidden max-w-md text-balance text-base leading-relaxed text-zinc-600 sm:block sm:text-lg">
            Con las fotos que ya tienes armamos video y escenas nuevas todo el
            mes, y las subimos a tus redes.
          </p>

          {/* Un solo botón. El "Cómo funciona" que lo acompañaba mandaba a
              una sección que está a un scroll de distancia y le quitaba
              peso al único clic que importa aquí. */}
          {/* A /prueba y no a /registro: el embudo ya no es que se
              registre solo. La muestra es lo que vende, así que el único
              clic que importa es el que deja sus datos para poder
              hacérsela. /registro sigue existiendo para cuando abra el
              autoservicio, solo que ya no se anuncia aquí. */}
          <Link
            href="/prueba"
            className="mt-7 inline-flex items-center gap-2.5 rounded-full bg-accent-cta px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 sm:mt-8 sm:px-7 sm:py-3.5 sm:text-[15px] sm:font-medium"
          >
            Quiero ver 3 piezas de mi producto
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>

          {/* Las dos objeciones que frenan a alguien en la orilla, juntas
              en un renglón, y las dos ciertas hoy: el registro solo pide
              correo y contraseña, y el mismo día queda armado el primer
              calendario — es lo que ya promete la sección de cierre.

              Fuera "onboarding": una palabra en inglés metida en una frase
              en español es de las que delatan una plantilla traducida, y
              además la mitad de los dueños de negocio no sabe qué es. */}
          <p className="mt-4 text-xs text-zinc-500">
            Con tus propias fotos · Te las mando en menos de 24 horas
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
      <HeroProtagonista className="pointer-events-none order-1 mx-auto aspect-[613/850] h-[44svh] max-h-[400px] shrink-0 sm:absolute sm:bottom-0 sm:-right-8 sm:order-none sm:mx-0 sm:h-[78%] sm:max-h-none lg:right-0 lg:h-[94%]" />
    </section>
  );
}
