"use client";

import type { CSSProperties } from "react";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Las categorías de producto con las que Frames trabaja, flotando en vez
 * de en cuadrícula.
 *
 * Eran nueve giros —gimnasios, restaurantes, inmobiliarias— con un símbolo
 * 3D cada uno. Al pasar a marcas de producto empacado, esos símbolos
 * dejaron de poder reciclarse: una mancuerna no ilustra "skincare", y
 * reetiquetar la imagen habría dejado el dibujo desmintiendo al texto tres
 * pantallas debajo del titular. Las piezas pasan a ser pastillas del mismo
 * plástico que el resto del sitio, así que el material se conserva sin
 * depender de nueve archivos que ya no corresponden. Los .webp se quedan en
 * public/giros por si vuelve la versión general de la portada.
 *
 * La lista es la del filtro real: producto de forma rígida, que la
 * referencia respeta. Por eso no aparecen ropa ni calzado.
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
  /** Posición en la lona, en porcentaje.
   *
   *  Hay un par por pantalla porque el ancho de la ficha no cambia con la
   *  ventana pero el de la lona sí: en celular la lona mide 342 px. Con las
   *  posiciones de escritorio, varias se salían.
   *
   *  Van tres por renglón y todas miden lo mismo, no lo que mida su
   *  etiqueta: así "Suplementos" ocupa igual que "Tés" y la nube no se
   *  desbalancea sola.
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

// Rótulos de una sola palabra donde se pueda. La ficha mide 100 px de
// ancho en celular —que es lo que deja meter tres columnas en 342 px sin
// que se toquen— y "Skincare y cosmética" a 13 px se parte en tres
// renglones ahí adentro. El subtítulo de la sección ya explica el filtro,
// así que la pastilla solo tiene que nombrar la categoría.
const GIROS: Giro[] = [
  { label: "Skincare", x: 6, y: 35, xMovil: 0, yMovil: 38, giro: -3, ritmo: 6.1, vuelo: 8 },
  { label: "Café", x: 37, y: 0, xMovil: 35, yMovil: 4, giro: 2.5, ritmo: 7.3, vuelo: 7 },
  { label: "Tés", x: 2, y: 0, xMovil: 1, yMovil: 0, giro: 1.5, ritmo: 5.4, vuelo: 8 },
  { label: "Salsas", x: 70, y: 0, xMovil: 67, yMovil: 2, giro: -2, ritmo: 8.2, vuelo: 6 },
  { label: "Velas", x: 3, y: 68, xMovil: 1, yMovil: 68, giro: 3, ritmo: 6.8, vuelo: 8 },
  { label: "Suplementos", x: 40, y: 35, xMovil: 36, yMovil: 34, giro: -1.5, ritmo: 7.9, vuelo: 7 },
  { label: "Cabello", x: 69, y: 68, xMovil: 67, yMovil: 70, giro: 2, ritmo: 5.9, vuelo: 8 },
  { label: "Joyería", x: 36, y: 68, xMovil: 34, yMovil: 72, giro: -2.5, ritmo: 8.7, vuelo: 6 },
  { label: "Perfumes", x: 73, y: 35, xMovil: 68, yMovil: 36, giro: 1, ritmo: 6.4, vuelo: 8 },
];

export default function IndustryScrollGallery() {
  const reducirMovimiento = useReducedMotion();

  return (
    <section className="relative overflow-hidden py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">PARA QUIÉN ES ESTO</p>
        {/* Decía "para cualquier tipo de negocio", que es lo contrario de
            especializarse: al que vende cremas no lo tranquiliza saber que
            también le hacemos las redes a una inmobiliaria. */}
        <h2 className="max-w-md text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Frascos, bolsas, latas y cajas
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base">
          Lo que mantiene su forma sale bien. Por eso en esta lista no hay ropa ni zapatos: la tela
          cae distinto en cada toma y ahí se nota.
        </p>

        {/* Alto fijo y fichas en posición absoluta: es lo que permite que no
            guarden fila ni columna. Con `flex-wrap` volverían a alinearse
            solas en cuanto cambiara el ancho. */}
        {/* La lona lleva ancho máximo, y eso es nuevo: con los símbolos 3D
            las fichas medían 130×160 y llenaban los 1152 px del contenedor,
            pero unas pastillas de 44 px de alto en esa misma lona se
            quedaban sueltas —tres columnas separadas por 300 px de aire, y
            el tercio derecho vacío—. Se ve en una captura y no en el
            código, que es justo por lo que hay que mirarla.

            Fijar el ancho también vuelve predecibles los porcentajes: hasta
            ahora las posiciones de celular se calcularon contra 342 px y en
            un teléfono más ancho se estiraban solas. */}
        <div className="relative mt-10 h-[300px] w-full max-w-[21.5rem] sm:mt-14 sm:max-w-2xl">
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
                className="flex w-[100px] items-center justify-center rounded-2xl bg-[image:var(--plastico)] px-3 py-3 text-center shadow-[var(--relieve-pieza)] sm:w-[130px] sm:px-4 sm:py-3.5"
                style={{ rotate: g.giro }}
                animate={reducirMovimiento ? undefined : { y: [0, -g.vuelo, 0] }}
                transition={
                  reducirMovimiento ? undefined : { duration: g.ritmo, repeat: Infinity, ease: "easeInOut" }
                }
              >
                <p className="text-balance text-center text-[13px] font-medium leading-tight text-zinc-800 sm:text-sm">
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
