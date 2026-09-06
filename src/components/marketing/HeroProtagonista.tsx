"use client";

import { useEffect } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

/**
 * El personaje del hero, que responde a cómo mueves el dispositivo.
 *
 * No hay varios cuadros ni un video: es una sola imagen inclinada en 3D
 * real con `perspective` + `rotateY`. En ángulos chicos —que es todo lo
 * que da mover un celular en la mano— se lee como que voltea. Pasado de
 * ahí deja de leerse como un giro y empieza a leerse como una foto
 * ladeada, así que el rango se queda corto a propósito.
 *
 * Lo que de verdad vende el efecto es el destello de los lentes, y por eso
 * se dibuja aquí y no viene pintado en el render: un brillo fijo se queda
 * quieto mientras todo lo demás se mueve, y ahí se cae el truco. Va
 * recortado a la silueta exacta de las micas con una máscara sacada del
 * mismo render (ver `hero()` en scripts/agent-art.py), así nunca se
 * derrama al armazón ni a la cara.
 */

/** Grados de giro en el extremo del recorrido. */
const GIRO = 13;
/** El destello recorre más que la cabeza: esa diferencia de velocidad es
 *  lo que hace que el cristal se sienta por delante de la cara. */
const ARRASTRE_BRILLO = 26;

export default function HeroProtagonista({ className = "" }: { className?: string }) {
  const reducirMovimiento = useReducedMotion();

  // −1 a 1 en cada eje. Un resorte suaviza el salto entre lecturas: sin
  // él, el giroscopio llega a tirones y el personaje tiembla.
  const ejeX = useMotionValue(0);
  const ejeY = useMotionValue(0);
  const suaveX = useSpring(ejeX, { stiffness: 60, damping: 18, mass: 0.6 });
  const suaveY = useSpring(ejeY, { stiffness: 60, damping: 18, mass: 0.6 });

  const rotateY = useTransform(suaveX, [-1, 1], [-GIRO, GIRO]);
  const rotateX = useTransform(suaveY, [-1, 1], [GIRO / 2.5, -GIRO / 2.5]);
  const brillo = useTransform(suaveX, [-1, 1], [`${ARRASTRE_BRILLO}%`, `${-ARRASTRE_BRILLO}%`]);

  useEffect(() => {
    if (reducirMovimiento) return;

    const limitar = (v: number) => Math.max(-1, Math.min(1, v));
    let usandoSensor = false;

    // Mouse en computadora. En táctil solo dispara mientras se arrastra el
    // dedo, que es justo el gesto que uno hace sobre algo que se mueve.
    const alMover = (e: PointerEvent) => {
      if (usandoSensor) return;
      ejeX.set(limitar((e.clientX / window.innerWidth) * 2 - 1));
      ejeY.set(limitar((e.clientY / window.innerHeight) * 2 - 1));
    };

    // El giroscopio entra solo en Android; en iOS hace falta un permiso
    // que solo se puede pedir tras un toque, y un diálogo de permisos en
    // una landing espanta más de lo que impresiona. No se pide: quien no
    // lo tenga se queda con el dedo y el scroll, que ya se sienten bien.
    const alInclinar = (e: DeviceOrientationEvent) => {
      if (e.gamma === null && e.beta === null) return;
      usandoSensor = true;
      ejeX.set(limitar((e.gamma ?? 0) / 28));
      ejeY.set(limitar(((e.beta ?? 45) - 45) / 28));
    };

    // Y en un celular quieto, sin dedo encima y sin sensor, el scroll lo
    // mantiene vivo mientras la sección pasa por pantalla.
    const alScroll = () => {
      if (usandoSensor) return;
      const avance = window.scrollY / Math.max(window.innerHeight, 1);
      if (avance > 1.2) return;
      ejeY.set(limitar(avance * 1.6 - 0.5));
      ejeX.set(limitar(Math.sin(avance * Math.PI * 1.4) * 0.65));
    };

    window.addEventListener("pointermove", alMover, { passive: true });
    window.addEventListener("deviceorientation", alInclinar);
    window.addEventListener("scroll", alScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", alMover);
      window.removeEventListener("deviceorientation", alInclinar);
      window.removeEventListener("scroll", alScroll);
    };
  }, [ejeX, ejeY, reducirMovimiento]);

  const mascara = {
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
        // `h-full` aquí no es decorativo: sin un alto definido en este
        // eslabón, el `h-full` del <img> no tiene contra qué resolver y
        // cae al alto natural del archivo — 1400 px, sin importar lo que
        // diga la clase de afuera.
        className="relative inline-block h-full"
        style={{
          rotateX,
          rotateY,
          // El color de la página, repetido aquí: se ve igual que si no
          // hubiera fondo, pero le da al multiply del render algo contra
          // qué multiplicar. Hace falta porque el `rotate` de arriba crea
          // contexto de apilamiento y aísla el blend de su hijo — sin
          // este color el fondo blanco del render se queda blanco y
          // aparece un rectángulo recortado sobre la página.
          backgroundColor: "var(--background)",
          transformStyle: "preserve-3d",
        }}
      >
        <img
          src="/hero/protagonista.webp"
          alt=""
          aria-hidden="true"
          className="block h-full w-auto max-w-none object-contain mix-blend-multiply"
        />

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={mascara}>
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
