"use client";

import type { CSSProperties } from "react";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Los giros que atiende Frames, flotando en vez de en cuadrícula.
 *
 * Antes eran seis celdas iguales con líneas divisorias — el mismo bloque
 * que tiene cualquier landing tres veces en la misma página, y que aquí
 * competía con la de "Cómo funciona" a un scroll de distancia.
 *
 * El desorden es a propósito y está medido: colocadas a intervalos
 * regulares volverían a leerse como retícula, solo que torcida. Cada ficha
 * trae su posición, su inclinación y su ritmo de flotación, y ninguno de
 * los tres coincide con el de su vecina.
 */
type Giro = {
  label: string;
  simbolo: string;
  /** Posición en la lona, en porcentaje.
   *
   *  Hay un par por pantalla porque el ancho de la ficha no cambia con la
   *  ventana pero el de la lona sí: en celular la lona mide 342 px. Con las
   *  posiciones de escritorio, varias se salían.
   *
   *  En celular van de dos por renglón, emparejando cada etiqueta ancha
   *  con una angosta — Restaurantes con Tiendas, Apps móviles con SaaS —
   *  porque así caben las dos en 342 px. Una por renglón dejaba la sección
   *  el doble de larga de lo que debe ser. "Servicios profesionales" es la
   *  única que va sola: mide 250 px y no le queda sitio a ninguna al lado. */
  x: number;
  y: number;
  xMovil: number;
  yMovil: number;
  /** Inclinación en grados. Chica: pasados unos 5° las fichas dejan de
   *  verse flotando y empiezan a verse mal alineadas. */
  giro: number;
  /** Segundos por ciclo de flotación. Todos distintos y sin múltiplos
   *  entre sí, para que el grupo nunca se sincronice — cuando eso pasa,
   *  nueve cosas subiendo a la vez se leen como un solo bloque moviéndose,
   *  que es lo contrario de flotar. */
  ritmo: number;
  /** Cuánto sube y baja, en píxeles. Tope de 8: dos fichas vecinas que
   *  flotan en sentido contrario cierran el doble de eso, y en celular la
   *  separación entre renglones es de 18 px. Con la amplitud anterior, de
   *  13, se tocaban a media animación. */
  vuelo: number;
};

const GIROS: Giro[] = [
  { label: "Gimnasios", simbolo: "/giros/gimnasio.webp", x: 3, y: 3, xMovil: 52, yMovil: 49, giro: -3, ritmo: 6.1, vuelo: 8 },
  { label: "Cafeterías", simbolo: "/giros/cafeteria.webp", x: 27, y: 21, xMovil: 4, yMovil: 25, giro: 2.5, ritmo: 7.3, vuelo: 7 },
  { label: "Restaurantes", simbolo: "/giros/restaurante.webp", x: 51, y: 1, xMovil: 0, yMovil: 1, giro: 1.5, ritmo: 5.4, vuelo: 8 },
  { label: "Tiendas", simbolo: "/giros/tienda.webp", x: 75, y: 19, xMovil: 53, yMovil: 5, giro: -2, ritmo: 8.2, vuelo: 6 },
  { label: "Inmobiliaria", simbolo: "/giros/inmobiliaria.webp", x: 7, y: 45, xMovil: 0, yMovil: 45, giro: 3, ritmo: 6.8, vuelo: 8 },
  { label: "SaaS", simbolo: "/giros/saas.webp", x: 38, y: 54, xMovil: 60, yMovil: 65, giro: -1.5, ritmo: 7.9, vuelo: 7 },
  { label: "Servicios profesionales", simbolo: "/giros/servicios.webp", x: 59, y: 43, xMovil: 8, yMovil: 89, giro: 2, ritmo: 5.9, vuelo: 8 },
  { label: "Apps móviles", simbolo: "/giros/apps.webp", x: 14, y: 73, xMovil: 2, yMovil: 69, giro: -2.5, ritmo: 8.7, vuelo: 6 },
  { label: "Agencias", simbolo: "/giros/agencias.webp", x: 47, y: 81, xMovil: 50, yMovil: 21, giro: 1, ritmo: 6.4, vuelo: 8 },
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

        {/* Alto fijo y fichas en posición absoluta: es lo que permite que no
            guarden fila ni columna. Con `flex-wrap` volverían a alinearse
            solas en cuanto cambiara el ancho. */}
        <div className="relative mt-10 h-[460px] sm:mt-14 sm:h-[400px]">
          {GIROS.map((g, i) => (
            <motion.div
              key={g.label}
              className="absolute left-[var(--x)] top-[var(--y)] sm:left-[var(--x-sm)] sm:top-[var(--y-sm)]"
              style={
                {
                  "--x": `${g.xMovil}%`,
                  "--y": `${g.yMovil}%`,
                  "--x-sm": `${g.x}%`,
                  "--y-sm": `${g.y}%`,
                } as CSSProperties
              }
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: "easeOut" }}
            >
              <motion.div
                className="flex items-center gap-2 rounded-full border border-[var(--hairline)] bg-white py-1.5 pl-1.5 pr-4 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.28)] sm:gap-2.5 sm:pr-5"
                style={{ rotate: g.giro }}
                animate={reducirMovimiento ? undefined : { y: [0, -g.vuelo, 0] }}
                transition={
                  reducirMovimiento ? undefined : { duration: g.ritmo, repeat: Infinity, ease: "easeInOut" }
                }
              >
                {/* mix-blend-multiply y no recorte con transparencia: el
                    fondo de los símbolos quedó en blanco exacto al
                    procesarlos, y contra el blanco de la ficha desaparece. */}
                <img
                  src={g.simbolo}
                  alt=""
                  aria-hidden="true"
                  className="h-9 w-9 shrink-0 object-contain mix-blend-multiply sm:h-10 sm:w-10"
                />
                <p className="whitespace-nowrap text-[13px] font-medium leading-none text-zinc-950 sm:text-sm">
                  {g.label}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
