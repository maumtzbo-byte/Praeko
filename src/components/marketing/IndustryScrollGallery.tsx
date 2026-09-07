"use client";

import type { CSSProperties } from "react";

import { motion, useReducedMotion } from "framer-motion";
import { Dumbbell, UtensilsCrossed, Sparkles, ShoppingBag, HeartPulse, Briefcase, type LucideIcon } from "lucide-react";

/**
 * Los giros que atiende Frames, flotando en vez de en cuadrícula.
 *
 * Antes eran seis celdas iguales con líneas divisorias — el mismo bloque
 * que tiene cualquier landing tres veces en la misma página, y que aquí
 * competía con la retícula de "Cómo funciona" a un scroll de distancia.
 *
 * El desorden es a propósito y está medido: si las fichas se colocaran a
 * intervalos regulares volvería a leerse como retícula, solo que torcida.
 * Cada una trae su posición, su giro y su ritmo de flotación, y ninguno de
 * los tres coincide con el de su vecina.
 */
type Giro = {
  label: string;
  icon: LucideIcon;
  /** Posición en la lona, en porcentaje. Escogidas a mano para que ninguna
   *  ficha se encime con otra ni se salga por la derecha.
   *
   *  Hay un par por pantalla porque el ancho de la ficha no cambia con la
   *  ventana pero el de la lona sí: "Gimnasio o estudio boutique" mide 285
   *  px y en un celular la lona mide 342, así que a esa ficha le quedan 57
   *  px de juego horizontal. Con las posiciones de escritorio, dos fichas
   *  se salían de la pantalla. */
  x: number;
  y: number;
  xMovil: number;
  yMovil: number;
  /** Inclinación en grados. Chica: pasados unos 5° las fichas dejan de
   *  verse flotando y empiezan a verse mal alineadas. */
  giro: number;
  /** Segundos que tarda un ciclo de flotación. Todos distintos y sin
   *  múltiplos entre sí, para que el grupo nunca se sincronice — cuando
   *  eso pasa, seis cosas subiendo a la vez se leen como un solo bloque
   *  moviéndose, que es justo lo contrario de flotar. */
  ritmo: number;
  /** Cuánto sube y baja, en píxeles. */
  vuelo: number;
};

const GIROS: Giro[] = [
  { label: "Gimnasio o estudio boutique", icon: Dumbbell, x: 4, y: 6, xMovil: 0, yMovil: 3, giro: -3, ritmo: 6.1, vuelo: 10 },
  { label: "Restaurante o cafetería", icon: UtensilsCrossed, x: 55, y: 0, xMovil: 15, yMovil: 19, giro: 2.5, ritmo: 7.3, vuelo: 13 },
  { label: "Belleza y estética", icon: Sparkles, x: 30, y: 30, xMovil: 32, yMovil: 35, giro: 1.5, ritmo: 5.4, vuelo: 8 },
  { label: "Retail o tienda", icon: ShoppingBag, x: 68, y: 40, xMovil: 6, yMovil: 51, giro: -2, ritmo: 8.2, vuelo: 12 },
  { label: "Salud y bienestar", icon: HeartPulse, x: 2, y: 55, xMovil: 29, yMovil: 66, giro: 3, ritmo: 6.8, vuelo: 9 },
  { label: "Servicios profesionales", icon: Briefcase, x: 38, y: 72, xMovil: 2, yMovil: 82, giro: -1.5, ritmo: 7.9, vuelo: 11 },
];

export default function IndustryScrollGallery() {
  const reducirMovimiento = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">PARA QUIÉN ES ESTO</p>
        <h2 className="max-w-md text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Contenido para cualquier tipo de negocio
        </h2>

        {/* Alto fijo y fichas en posición absoluta: es lo que permite que
            no guarden fila ni columna. Con `flex-wrap` volverían a
            alinearse solas en cuanto cambiara el ancho. */}
        <div className="relative mt-10 h-[430px] sm:mt-14 sm:h-[340px]">
          {GIROS.map((giro, i) => {
            const Icon = giro.icon;
            return (
              <motion.div
                key={giro.label}
                className="absolute left-[var(--x)] top-[var(--y)] sm:left-[var(--x-sm)] sm:top-[var(--y-sm)]"
                style={
                  {
                    "--x": `${giro.xMovil}%`,
                    "--y": `${giro.yMovil}%`,
                    "--x-sm": `${giro.x}%`,
                    "--y-sm": `${giro.y}%`,
                  } as CSSProperties
                }
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.07, ease: "easeOut" }}
              >
                <motion.div
                  className="flex items-center gap-2.5 rounded-full border border-[var(--hairline)] bg-white py-2.5 pl-3.5 pr-4 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.28)] sm:gap-3 sm:py-3 sm:pl-4 sm:pr-5"
                  style={{ rotate: giro.giro }}
                  animate={reducirMovimiento ? undefined : { y: [0, -giro.vuelo, 0] }}
                  transition={
                    reducirMovimiento
                      ? undefined
                      : { duration: giro.ritmo, repeat: Infinity, ease: "easeInOut" }
                  }
                >
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-accent sm:h-[18px] sm:w-[18px]" strokeWidth={1.75} />
                  <p className="whitespace-nowrap text-[13px] font-medium leading-none text-zinc-950 sm:text-sm">
                    {giro.label}
                  </p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
