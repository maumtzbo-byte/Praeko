import type { ReactNode } from "react";

import { FramesMark } from "@/components/brand/FramesMark";

/**
 * La capa que se come la pantalla cuando el embudo pasa de vender a
 * trabajar.
 *
 * Hasta el paso 1, /prueba es una página de venta: titular, números,
 * precio, y el formulario a un lado. En cuanto el prospecto manda sus
 * datos, esa página ya hizo su trabajo — y dejarla ahí detrás, con el
 * asistente metido en un rectángulo de la columna derecha, le roba a cada
 * sección la mitad del ancho que necesita.
 *
 * Por eso esto no es un modal con fondo oscuro ni un rectángulo más
 * grande: es la pantalla completa, con el mismo fondo del sitio. Lo que
 * antes era una tarjeta dentro de una página pasa a ser LA página.
 *
 * Sin botón de cerrar, y es deliberado. No hay a dónde volver que le
 * sirva: sus datos ya están guardados y regresar a la página de venta
 * sería mandarlo a que le vuelvan a vender algo que ya aceptó. La salida
 * de cada sección es "Mejor luego", que avanza en vez de retroceder.
 */
export function PantallaCompleta({
  children,
  encabezado,
}: {
  children: ReactNode;
  /** Lo que va debajo del logo: la barra de avance del asistente, o nada
   *  en la pantalla de cierre. */
  encabezado?: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--background)]">
      <header className="shrink-0 border-b border-[var(--hairline)]">
        <div className="mx-auto flex w-full max-w-lg items-center gap-2 px-5 py-4">
          <FramesMark className="h-5 w-5 text-zinc-950" />
          <span className="text-sm font-semibold tracking-[0.2em] text-zinc-950">FRAMES</span>
        </div>
        {encabezado}
      </header>

      {/* El scroll vive aquí y no en el documento: con `fixed inset-0` el
          body de atrás sigue existiendo, y si el desbordamiento se dejara
          suelto se podrían arrastrar dos cosas a la vez. */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-lg px-5 pb-12 pt-7">{children}</div>
      </div>
    </div>
  );
}
