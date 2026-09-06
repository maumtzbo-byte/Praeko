"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/**
 * El personaje del hero, que sigue al cursor con la mirada.
 *
 * No hay varios cuadros ni un video: es una sola imagen. La cabeza se
 * inclina con `perspective` + `rotateY` y las pupilas se mueven aparte —
 * y son ellas las que hacen el trabajo. Una cabeza que se inclina se lee
 * como un gesto; unos ojos que te siguen se leen como que te está
 * mirando, que es otra cosa.
 *
 * Por eso las pupilas no vienen en el render: se borran al preparar el
 * asset (ver `hero()` en scripts/agent-art.py, que además deja aquí su
 * posición) y se vuelven a dibujar encima para poder moverlas.
 *
 * El destello de los lentes también se dibuja aquí, recortado a la
 * silueta exacta de las micas. Un brillo pintado en la imagen se queda
 * quieto mientras todo lo demás se mueve, y ahí se cae el truco.
 */

/** Posición de cada pupila en porcentaje del render, tal como la midió
 *  `hero()`. En porcentaje y no en píxeles porque la imagen se muestra a
 *  alturas distintas según el ancho de pantalla. */
const OJOS = [
  { x: 40.147, y: 26.82, rx: 2.571, ry: 2.529 },
  { x: 67.521, y: 26.816, rx: 2.571, ry: 2.529 },
];

/** El punto que "mira": el centro entre los dos ojos. */
const CARA = { x: (OJOS[0].x + OJOS[1].x) / 2, y: OJOS[0].y };

/** A qué distancia del personaje el gesto ya llegó a su tope. Más chico
 *  que la pantalla a propósito: si se normaliza contra el ancho de la
 *  ventana, en un monitor grande hay que cruzarla entera para que voltee. */
const ALCANCE_X = 520;
const ALCANCE_Y = 420;

/** Grados de giro en el extremo del recorrido. Corto a propósito: pasado
 *  de ahí deja de leerse como un giro y empieza a leerse como una foto
 *  ladeada. */
const GIRO = 14;
/** Cuánto se corren las pupilas, en porcentaje del render. Se queda muy
 *  por dentro del cristal: un ojo pegado al armazón se ve desorbitado. */
const PASEO_OJO_X = 2.6;
const PASEO_OJO_Y = 1.4;
/** El destello recorre más que la cabeza: esa diferencia de velocidad es
 *  lo que hace sentir el cristal por delante de la cara. */
const ARRASTRE_BRILLO = 26;

export default function HeroProtagonista({ className = "" }: { className?: string }) {
  const reducirMovimiento = useReducedMotion();
  const caja = useRef<HTMLDivElement>(null);

  const ejeX = useMotionValue(0);
  const ejeY = useMotionValue(0);
  // Un resorte suaviza el salto entre lecturas: sin él el giroscopio llega
  // a tirones y el personaje tiembla.
  const suaveX = useSpring(ejeX, { stiffness: 70, damping: 17, mass: 0.5 });
  const suaveY = useSpring(ejeY, { stiffness: 70, damping: 17, mass: 0.5 });

  const rotateY = useTransform(suaveX, [-1, 1], [-GIRO, GIRO]);
  const rotateX = useTransform(suaveY, [-1, 1], [GIRO / 2.6, -GIRO / 2.6]);
  const ojoX = useTransform(suaveX, [-1, 1], [`${-PASEO_OJO_X}%`, `${PASEO_OJO_X}%`]);
  const ojoY = useTransform(suaveY, [-1, 1], [`${-PASEO_OJO_Y}%`, `${PASEO_OJO_Y}%`]);
  const brillo = useTransform(suaveX, [-1, 1], [`${ARRASTRE_BRILLO}%`, `${-ARRASTRE_BRILLO}%`]);

  useEffect(() => {
    if (reducirMovimiento) return;

    const limitar = (v: number) => Math.max(-1, Math.min(1, v));
    let usandoSensor = false;

    // Se mide contra la cara del personaje, no contra el centro de la
    // ventana: lo que se quiere es que mire al cursor, y para eso importa
    // dónde está el cursor respecto a él, no respecto a la pantalla.
    const apuntar = (clientX: number, clientY: number) => {
      const el = caja.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      ejeX.set(limitar((clientX - (r.left + (r.width * CARA.x) / 100)) / ALCANCE_X));
      ejeY.set(limitar((clientY - (r.top + (r.height * CARA.y) / 100)) / ALCANCE_Y));
    };

    const alMover = (e: PointerEvent) => {
      if (usandoSensor) return;
      apuntar(e.clientX, e.clientY);
    };
    // Un toque sin arrastre no dispara `pointermove`, así que en celular
    // picarle en un punto no haría nada sin esto.
    const alPicar = (e: PointerEvent) => {
      usandoSensor = false;
      apuntar(e.clientX, e.clientY);
    };

    // El giroscopio entra solo en Android; en iOS hace falta un permiso
    // que solo se puede pedir tras un toque, y un diálogo de permisos en
    // una landing espanta más de lo que impresiona. No se pide: quien no
    // lo tenga se queda con el dedo y el scroll.
    const alInclinar = (e: DeviceOrientationEvent) => {
      if (e.gamma === null && e.beta === null) return;
      usandoSensor = true;
      ejeX.set(limitar((e.gamma ?? 0) / 26));
      ejeY.set(limitar(((e.beta ?? 45) - 45) / 26));
    };

    // Y en un celular quieto, sin dedo encima y sin sensor, el scroll lo
    // mantiene vivo mientras la sección pasa por pantalla.
    const alScroll = () => {
      if (usandoSensor) return;
      const avance = window.scrollY / Math.max(window.innerHeight, 1);
      if (avance > 1.2) return;
      ejeY.set(limitar(avance * 1.6 - 0.5));
      ejeX.set(limitar(Math.sin(avance * Math.PI * 1.4) * 0.7));
    };

    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("pointerdown", alPicar, { passive: true });
    window.addEventListener("deviceorientation", alInclinar);
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("pointerdown", alPicar);
      window.removeEventListener("deviceorientation", alInclinar);
      window.removeEventListener("scroll", alScroll);
    };
  }, [ejeX, ejeY, reducirMovimiento]);

  const mascaraMicas = {
    maskImage: "url(/hero/protagonista-lentes.png)",
    WebkitMaskImage: "url(/hero/protagonista-lentes.png)",
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  } as const;

  return (
    <div className={className} style={{ perspective: 1200 }}>
      <motion.div
        ref={caja}
        // `h-full` no es decorativo: sin un alto definido en este eslabón
        // el `h-full` del <img> no tiene contra qué resolver y cae al alto
        // natural del archivo, ignorando la clase de afuera.
        className="relative inline-block h-full"
        style={{
          rotateX,
          rotateY,
          // El giro pivota abajo, no en el centro: así la cabeza describe
          // un arco y el cuerpo se queda plantado, que es como voltea
          // alguien. Pivotando en el centro se mece entero, como un cuadro
          // colgado.
          transformOrigin: "50% 100%",
          // El color de la página, repetido aquí: se ve igual que si no
          // hubiera fondo, pero le da al multiply del render algo contra
          // qué multiplicar. El `rotate` crea contexto de apilamiento y
          // aísla el blend — sin este color el fondo blanco de la imagen
          // se queda blanco y aparece un rectángulo sobre la página.
          backgroundColor: "var(--background)",
        }}
      >
        <img
          src="/hero/protagonista.webp"
          alt=""
          aria-hidden="true"
          className="block h-full w-auto max-w-none object-contain mix-blend-multiply"
        />

        {/* Las pupilas van recortadas a las micas por seguridad, aunque su
            recorrido ya se queda corto: en una pantalla muy ancha el
            redondeo del porcentaje podría asomar un borde sobre el
            armazón. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={mascaraMicas}>
          {OJOS.map((ojo) => (
            <motion.span
              key={ojo.x}
              className="absolute rounded-[50%]"
              style={{
                left: `${ojo.x - ojo.rx}%`,
                top: `${ojo.y - ojo.ry}%`,
                width: `${ojo.rx * 2}%`,
                height: `${ojo.ry * 2}%`,
                x: ojoX,
                y: ojoY,
                // Muestreado del render antes de borrarlas: el núcleo es
                // rgb(17,30,32) y el borde aclara hacia rgb(76,96,98).
                background: "radial-gradient(60% 55% at 38% 30%, #24393b 0%, #142325 55%, #101d1e 100%)",
              }}
            />
          ))}
        </div>

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={mascaraMicas}>
          <motion.div
            className="absolute inset-y-0 left-[-60%] w-[220%]"
            style={{
              x: brillo,
              background:
                "linear-gradient(108deg, transparent 34%, rgba(255,255,255,0.30) 44%, rgba(255,255,255,0.70) 50%, rgba(255,255,255,0.30) 56%, transparent 66%)",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
