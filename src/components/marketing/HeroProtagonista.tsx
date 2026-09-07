"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * El personaje gira la cabeza hacia donde apuntas, cambiando de cuadro.
 *
 * El índice 0 es la cabeza girada hacia la izquierda del espectador y el
 * último hacia la derecha, para que mire hacia donde está el cursor y no
 * al lado contrario.
 *
 * Los cuadros salen de `scripts/hero-giro.py`, que los elige por ángulo,
 * aplana el fondo y los alinea entre sí. Lo que sigue viniendo de fábrica
 * en este video: los reflejos están pegados en las micas y la compresión
 * se comió los bordes.
 */

const CUADROS = 13;
const RUTAS = Array.from({ length: CUADROS }, (_, i) => `/hero/giro/${String(i).padStart(2, "0")}.webp`);
/** El recorrido se normaliza contra la distancia del personaje a cada
 *  borde de la ventana, no contra una distancia fija. Con una distancia
 *  fija y el personaje pegado a la derecha, el mouse nunca llega
 *  suficientemente lejos por ese lado y la mitad de los cuadros queda
 *  inalcanzable. */

export default function HeroProtagonista({ className = "" }: { className?: string }) {
  const reducirMovimiento = useReducedMotion();
  const [cuadro, setCuadro] = useState(Math.floor(CUADROS / 2));

  useEffect(() => {
    if (reducirMovimiento) return;

    const apuntar = (clientX: number) => {
      const el = document.getElementById("protagonista");
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const margen = Math.max(80, clientX < cx ? cx : window.innerWidth - cx);
      const t = (clientX - cx) / margen;
      const i = Math.round(((Math.max(-1, Math.min(1, t)) + 1) / 2) * (CUADROS - 1));
      setCuadro(i);
    };

    const alMover = (e: PointerEvent) => apuntar(e.clientX);
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("pointerdown", alMover, { passive: true });
    return () => {
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerdown", alMover);
    };
  }, [reducirMovimiento]);

  return (
    // El color de la página como fondo: se ve igual que si no lo llevara,
    // pero le da al multiply de los cuadros algo contra qué multiplicar.
    // El fondo de los cuadros quedó en blanco exacto al aplanarlo, así que
    // multiplicado contra este color desaparece.
    <div id="protagonista" className={`relative ${className}`} style={{ backgroundColor: "var(--background)" }}>
      {/* Los trece van en el DOM desde el principio y solo se enciende uno.
          Cargarlos bajo demanda haría que el primer giro hacia cada lado
          llegara con un parpadeo en blanco. */}
      {RUTAS.map((ruta, i) => (
        <img
          key={ruta}
          src={ruta}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-contain object-bottom mix-blend-multiply"
          style={{ opacity: i === cuadro ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
