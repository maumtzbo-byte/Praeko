"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * El personaje gira la cabeza hacia donde apuntas.
 *
 * Son 33 cuadros fijos sacados de un video (ver scripts/hero-giro.py), no
 * un video reproduciéndose: lo que hace falta es saltar a un ángulo
 * arbitrario según dónde esté el cursor, y para eso hay que mover
 * `currentTime` a mano, que en Safari de iPhone va a tirones.
 *
 * El índice 0 es la cabeza girada hacia la izquierda del espectador y el
 * último hacia la derecha, para que mire hacia donde está el cursor y no
 * al lado contrario.
 *
 * Entre cuadro y cuadro se funde. Sin fundido, 33 ángulos siguen siendo 33
 * saltos y en algunos tramos el corte canta; con él, el mismo material se
 * lee continuo y sale más barato que duplicar el número de imágenes.
 */

const CUADROS = 33;
const RUTAS = Array.from({ length: CUADROS }, (_, i) => `/hero/giro/${String(i).padStart(2, "0")}.webp`);
/** Cuánto se acerca la posición a su destino en cada frame. Bajo para que
 *  el giro tenga algo de inercia y no se pegue al cursor como un espejo. */
const SUAVIZADO = 0.12;

export default function HeroProtagonista({ className = "" }: { className?: string }) {
  const reducirMovimiento = useReducedMotion();
  const caja = useRef<HTMLDivElement>(null);
  const imagenes = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const centro = (CUADROS - 1) / 2;
    // La posición no vive en el estado de React: se actualiza en cada
    // frame de animación, y un re-render de 33 <img> a 60 por segundo es
    // justo lo que no hay que hacer. Se escribe la opacidad directo en el
    // DOM, y solo sobre los dos cuadros que participan del fundido.
    let destino = centro;
    let actual = centro;
    let frame = 0;

    const pintar = () => {
      const bajo = Math.floor(actual);
      const alto = Math.min(CUADROS - 1, bajo + 1);
      const mezcla = actual - bajo;
      imagenes.current.forEach((el, i) => {
        if (!el) return;
        const o = i === bajo ? 1 : i === alto ? mezcla : 0;
        if (el.style.opacity !== String(o)) el.style.opacity = String(o);
      });
    };

    if (reducirMovimiento) {
      pintar();
      return;
    }

    const apuntar = (clientX: number) => {
      const el = caja.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      // El recorrido se normaliza contra la distancia a cada borde de la
      // ventana y no contra una distancia fija: con distancia fija y el
      // personaje pegado a la derecha, el cursor no llega suficientemente
      // lejos por ese lado y la mitad de los cuadros queda inalcanzable.
      const margen = Math.max(80, clientX < cx ? cx : window.innerWidth - cx);
      const t = Math.max(-1, Math.min(1, (clientX - cx) / margen));
      // El destino se redondea a un cuadro entero. Si se dejara
      // fraccionario, con el cursor quieto a medio camino el fundido se
      // congela en una mezcla de dos ángulos y se ve la cabeza doble. Así
      // el fundido solo existe mientras el giro viaja, y en reposo siempre
      // hay un cuadro limpio.
      destino = Math.round(((t + 1) / 2) * (CUADROS - 1));
    };

    const paso = () => {
      actual += (destino - actual) * SUAVIZADO;
      if (Math.abs(destino - actual) < 0.01) actual = destino;
      pintar();
      frame = requestAnimationFrame(paso);
    };

    const alMover = (e: PointerEvent) => apuntar(e.clientX);
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("pointerdown", alMover, { passive: true });
    frame = requestAnimationFrame(paso);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerdown", alMover);
    };
  }, [reducirMovimiento]);

  return (
    // El color de la página como fondo: se ve igual que si no lo llevara,
    // pero le da al multiply de los cuadros algo contra qué multiplicar.
    // El fondo de los cuadros quedó en blanco exacto al aplanarlo, así que
    // multiplicado contra este color desaparece.
    <div ref={caja} className={`relative ${className}`} style={{ backgroundColor: "var(--background)" }}>
      {/* La multiplicación va en el grupo y no en cada <img>: con dos
          cuadros fundiéndose, multiplicar cada uno por separado multiplica
          dos veces el tramo donde se encima el cuerpo y lo oscurece a
          media transición. Aquí se mezclan primero entre ellos y el
          resultado se multiplica una sola vez. */}
      <div aria-hidden="true" className="absolute inset-0 mix-blend-multiply">
        {RUTAS.map((ruta, i) => (
          <img
            key={ruta}
            ref={(el) => {
              imagenes.current[i] = el;
            }}
            src={ruta}
            alt=""
            className="absolute inset-0 h-full w-full object-contain object-bottom"
            style={{ opacity: i === Math.floor((CUADROS - 1) / 2) ? 1 : 0 }}
          />
        ))}
      </div>
    </div>
  );
}
