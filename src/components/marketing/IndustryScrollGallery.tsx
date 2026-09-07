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
   *  Van tres por renglón, y caben porque el nombre va DEBAJO del símbolo
   *  y no al lado: así cada pieza mide lo que mide su columna en vez de lo
   *  que mide su etiqueta, y "Servicios profesionales" ocupa lo mismo que
   *  "SaaS".
   *
   *  Las posiciones salen de medir las piezas en el navegador, no de
   *  calcularlas: la inclinación agranda la caja que ocupan —una pieza de
   *  100 px girada 3° ocupa 106— y con las medidas "de papel" tres
   *  columnas no cabían y se encimaban. */
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
  { label: "Gimnasios", simbolo: "/giros/gimnasio.webp", x: 6, y: 35, xMovil: 0, yMovil: 38, giro: -3, ritmo: 6.1, vuelo: 8 },
  { label: "Cafeterías", simbolo: "/giros/cafeteria.webp", x: 37, y: 0, xMovil: 35, yMovil: 4, giro: 2.5, ritmo: 7.3, vuelo: 7 },
  { label: "Restaurantes", simbolo: "/giros/restaurante.webp", x: 2, y: 0, xMovil: 1, yMovil: 0, giro: 1.5, ritmo: 5.4, vuelo: 8 },
  { label: "Tiendas", simbolo: "/giros/tienda.webp", x: 70, y: 0, xMovil: 67, yMovil: 2, giro: -2, ritmo: 8.2, vuelo: 6 },
  { label: "Inmobiliaria", simbolo: "/giros/inmobiliaria.webp", x: 3, y: 68, xMovil: 1, yMovil: 68, giro: 3, ritmo: 6.8, vuelo: 8 },
  { label: "SaaS", simbolo: "/giros/saas.webp", x: 40, y: 35, xMovil: 36, yMovil: 34, giro: -1.5, ritmo: 7.9, vuelo: 7 },
  { label: "Servicios profesionales", simbolo: "/giros/servicios.webp", x: 69, y: 68, xMovil: 67, yMovil: 70, giro: 2, ritmo: 5.9, vuelo: 8 },
  { label: "Apps móviles", simbolo: "/giros/apps.webp", x: 36, y: 68, xMovil: 34, yMovil: 72, giro: -2.5, ritmo: 8.7, vuelo: 6 },
  { label: "Agencias", simbolo: "/giros/agencias.webp", x: 73, y: 35, xMovil: 68, yMovil: 36, giro: 1, ritmo: 6.4, vuelo: 8 },
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
        <div className="relative mt-10 h-[420px] sm:mt-14 sm:h-[480px]">
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
                className="flex w-[100px] flex-col items-center gap-2 sm:w-[130px] sm:gap-2.5"
                style={{ rotate: g.giro }}
                animate={reducirMovimiento ? undefined : { y: [0, -g.vuelo, 0] }}
                transition={
                  reducirMovimiento ? undefined : { duration: g.ritmo, repeat: Infinity, ease: "easeInOut" }
                }
              >
                {/* Los archivos traen transparencia de verdad, no fondo
                    blanco disuelto con mix-blend-multiply. El blend dejaba
                    un recuadro: el fondo de los archivos promediaba 254.5,
                    no 255, y multiplicado contra la página daba 243 sobre
                    244. Un nivel, invisible en un monitor y perfectamente
                    visible en un OLED. Y de paso el blend obligaba a
                    pintarle el color de la página a cualquier ancestro que
                    creara contexto de apilamiento —el giro, el vaivén, la
                    animación de entrada—, cosa que ya no hace falta
                    vigilar. Ver scripts/alfa-simbolos.py. */}
                <img
                  src={g.simbolo}
                  alt=""
                  aria-hidden="true"
                  className="h-14 w-14 object-contain sm:h-20 sm:w-20"
                />
                <p className="text-balance text-center text-[13px] font-medium leading-tight text-zinc-700 sm:text-sm">
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
