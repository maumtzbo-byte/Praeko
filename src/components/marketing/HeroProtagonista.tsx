"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import manifiesto from "@/../public/hero/giro/cuadros.json";

/**
 * El personaje gira la cabeza hacia donde apuntas, en los dos ejes.
 *
 * Son cuadros fijos sacados de un video (ver scripts/hero-giro.py), no un
 * video reproduciéndose: hace falta saltar a un ángulo arbitrario según
 * dónde esté el cursor, y para eso hay que mover `currentTime` a mano, que
 * en Safari de iPhone va a tirones.
 *
 * Los cuadros no forman una fila ordenada sino una nube en el plano
 * giro × altura, porque el video trazó una espiral por ese plano y no una
 * retícula: hay combinaciones que nunca grabó, como mirar arriba y a la
 * derecha a la vez. Por eso la búsqueda es por cercanía y no por índice —
 * si se pide un ángulo que no existe, cae en el más parecido que sí.
 */

type Cuadro = { g: number; a: number };
const CUADROS: Cuadro[] = manifiesto.cuadros;
const RUTAS = CUADROS.map((_, i) => `/hero/giro/${String(i).padStart(2, "0")}.webp`);

/** El eje vertical pesa menos en la búsqueda: el video tiene mucho más
 *  recorrido de giro que de cabeceo, y sin compensarlo un movimiento
 *  vertical chico del cursor arrastra la cabeza de lado. */
const PESO_ALTURA = 0.7;
/** Duración del fundido entre un cuadro y el siguiente, en milisegundos.
 *  Sin fundido, la nube de cuadros se recorre a saltos visibles. */
const FUNDIDO = 130;

/** El cuadro más cercano a un punto del plano. */
function masCercano(g: number, a: number) {
  let mejor = 0;
  let dist = Infinity;
  for (let i = 0; i < CUADROS.length; i++) {
    const dg = CUADROS[i].g - g;
    const da = (CUADROS[i].a - a) * PESO_ALTURA;
    const d = dg * dg + da * da;
    if (d < dist) {
      dist = d;
      mejor = i;
    }
  }
  return mejor;
}

export default function HeroProtagonista({ className = "" }: { className?: string }) {
  const reducirMovimiento = useReducedMotion();
  const caja = useRef<HTMLDivElement>(null);
  // El cuadro que se muestra y el que se está dejando atrás, para poder
  // fundir entre los dos.
  const [actual, setActual] = useState(() => masCercano(0, 0));
  const [saliendo, setSaliendo] = useState<number | null>(null);

  useEffect(() => {
    if (reducirMovimiento) return;

    let temporizador: ReturnType<typeof setTimeout> | undefined;

    const apuntar = (clientX: number, clientY: number) => {
      const el = caja.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      // La cara, no el centro de la caja: el personaje ocupa todo el alto
      // y su cabeza está arriba, así que medir contra el centro haría que
      // mirara hacia abajo casi siempre.
      const cy = r.top + r.height * 0.18;
      // El recorrido se normaliza contra la distancia a cada borde de la
      // ventana y no contra una distancia fija: con distancia fija y el
      // personaje pegado a la derecha, el cursor no llega suficientemente
      // lejos por ese lado y media nube queda inalcanzable.
      const mx = Math.max(80, clientX < cx ? cx : window.innerWidth - cx);
      const my = Math.max(80, clientY < cy ? cy : window.innerHeight - cy);
      const g = Math.max(-1, Math.min(1, (clientX - cx) / mx));
      const a = Math.max(-1, Math.min(1, (clientY - cy) / my));

      const siguiente = masCercano(g, a);
      setActual((previo) => {
        if (siguiente === previo) return previo;
        setSaliendo(previo);
        clearTimeout(temporizador);
        temporizador = setTimeout(() => setSaliendo(null), FUNDIDO);
        return siguiente;
      });
    };

    const alMover = (e: PointerEvent) => apuntar(e.clientX, e.clientY);
    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("pointerdown", alMover, { passive: true });
    return () => {
      clearTimeout(temporizador);
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
        {RUTAS.map((ruta, i) => {
          const visible = i === actual || i === saliendo;
          if (!visible) return null;
          return (
            <img
              key={ruta}
              src={ruta}
              alt=""
              className="absolute inset-0 h-full w-full object-contain object-bottom"
              style={{
                opacity: i === actual ? 1 : 0,
                transition: `opacity ${FUNDIDO}ms linear`,
              }}
            />
          );
        })}
      </div>
      {/* Los demás quedan precargados y fuera de pantalla. Cargarlos bajo
          demanda hace que cada ángulo nuevo llegue con un parpadeo. */}
      <div aria-hidden="true" className="pointer-events-none absolute h-0 w-0 overflow-hidden">
        {RUTAS.map((ruta) => (
          <img key={ruta} src={ruta} alt="" />
        ))}
      </div>
    </div>
  );
}
