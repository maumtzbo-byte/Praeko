"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * PRUEBA — el personaje gira la cabeza cambiando de cuadro.
 *
 * Trece recortes sacados del video, elegidos por ángulo y no por tiempo:
 * el video barre a su izquierda, vuelve, barre a su derecha y regresa, así
 * que los ángulos que hacen falta están repartidos por toda la duración.
 * Cada uno se recorta anclado al centro de las micas, que es lo único que
 * se detecta limpio en un video comprimido, y así los ojos se quedan
 * quietos aunque la cabeza cabecee entre cuadro y cuadro.
 *
 * Se monta para juzgarlo en movimiento. Lo que ya se sabe que trae de
 * fábrica: los reflejos vienen pegados en las micas, el tamaño de la
 * cabeza baila entre cuadros y la compresión se comió los bordes.
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
          className="absolute inset-0 h-full w-auto object-contain mix-blend-multiply"
          style={{ opacity: i === cuadro ? 1 : 0 }}
        />
      ))}
    </div>
  );
}
