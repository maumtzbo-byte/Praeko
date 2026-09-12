"use client";

import type { ReactNode } from "react";

import { ligaWhatsapp } from "@/lib/contacto";
import { registrarSalida, type BotonDeSalida } from "@/lib/marketing/salidas";

/**
 * El botón que manda a WhatsApp, contándolo de paso.
 *
 * Los tres botones comerciales de la página eran `<a>` sueltos y por eso
 * el tráfico que sale por ahí no existía en ningún reporte. Envolverlos en
 * un componente pone el conteo en un solo lugar y evita que el próximo
 * botón nazca sin él.
 *
 * El registro NO se espera. `target="_blank"` deja viva esta pestaña, así
 * que la server action alcanza a terminar sola; y si no alcanza, da igual.
 * Lo que no puede pasar es que el prospecto espere a que guardemos una
 * estadística antes de que le abra WhatsApp.
 */
export function SalidaWhatsapp({
  mensaje,
  boton,
  className,
  children,
}: {
  mensaje: string;
  boton: BotonDeSalida;
  className?: string;
  children: ReactNode;
}) {
  function contar() {
    // Se lee del DOM en el clic y no con `useSearchParams` a propósito:
    // ese hook obliga a envolver el componente en <Suspense> y saca de
    // render estático a la página que lo use. Aquí el dato solo hace falta
    // en el momento del clic, donde la URL siempre está disponible.
    const origen = new URLSearchParams(window.location.search).get("origen");
    void registrarSalida({ boton, origen, ruta: window.location.pathname });
  }

  return (
    <a
      href={ligaWhatsapp(mensaje)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={contar}
      className={className}
    >
      {children}
    </a>
  );
}
