"use client";

import { motion } from "framer-motion";

// Sin descripción bajo cada paso: los cuatro títulos ya cuentan la
// historia completa —cuéntanos, arman, apruebas, se publica— y un párrafo
// debajo de cada uno llenaba la sección de texto chico que nadie lee.
//
// Lo que sí decían esas descripciones y valía la pena está verificado en
// otra parte de la página, no se perdió: el calendario mexicano y las
// respuestas a comentarios los dice cada agente en primera persona en
// "Tu nuevo equipo" (ver agents.ts).
//
// Los símbolos son objetos 3D del mismo material que los personajes —
// plástico mate, luz suave, un solo acento azul— en vez de íconos de línea.
// Con un muñeco 3D en la portada, un glifo de trazo aquí abajo se leía como
// de otra marca.
//
// Los cuatro pasos reales del producto, no una narrativa aspiracional: el
// cuestionario de onboarding, la generación por agentes, la aprobación en
// Publicaciones y la publicación a las redes conectadas. Cada uno existe
// hoy y se puede recorrer en la app.
const STEPS = [
  {
    simbolo: "/pasos/cuestionario.webp",
    title: "Cuéntanos de tu negocio",
  },
  {
    simbolo: "/pasos/calendario.webp",
    title: "Los agentes arman tu mes",
  },
  {
    simbolo: "/pasos/aprobacion.webp",
    title: "Tú apruebas",
  },
  {
    simbolo: "/pasos/publicacion.webp",
    title: "Se publica solo",
  },
];

// Las cuatro que están realmente integradas hoy. La lista es corta a
// propósito: inflarla con logos de plataformas que no se conectan sería
// justo lo que hace que una landing deje de ser creíble en la primera
// prueba.
const CHANNELS = ["Instagram", "Facebook", "TikTok", "Google Business"];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="relative py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">CÓMO FUNCIONA</p>
        <h2 className="max-w-lg text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          De no tener nada a publicar solo, en cuatro pasos
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base">
          Configuras una vez. Después tu única tarea recurrente es decir que sí.
        </p>

        {/* Zigzag a dos columnas desde tablet, y columna recta en celular
            con el símbolo alternando de lado.

            En celular no va en zigzag completo a propósito: en 390 px de
            ancho, dos columnas dejan cada bloque en unos 230 px y una
            descripción de tres renglones se estira a siete. Multiplicado
            por cuatro pasos, la sección se hace el doble de larga. Además
            una secuencia numerada es de los pocos casos donde la columna
            recta gana: el ojo baja 1-2-3-4 sin pensarlo. El movimiento que
            da el zigzag se consigue igual alternando solo el símbolo, y el
            texto conserva su ancho. */}
        <div className="mt-12 flex flex-col gap-8 sm:mt-16 sm:gap-10">
          {STEPS.map((step, i) => {
            const derecha = i % 2 === 1;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className={`flex items-center gap-4 sm:w-[54%] sm:gap-7 ${
                  derecha ? "flex-row-reverse text-right sm:ml-auto" : "sm:mr-auto"
                }`}
              >
                <img
                  src={step.simbolo}
                  alt=""
                  aria-hidden="true"
                  // mix-blend-multiply y no un recorte con transparencia: el
                  // fondo de los símbolos quedó en blanco exacto al
                  // procesarlos, y multiplicado contra la página desaparece.
                  className="h-24 w-24 shrink-0 object-contain mix-blend-multiply sm:h-32 sm:w-32"
                />
                {/* El número va dentro de la línea del título y no como
                    hermano en un flex: como hermano, en los pasos alineados
                    a la derecha el título ocupa todo el ancho sobrante y el
                    número se queda descolgado en el extremo opuesto. En
                    línea viaja pegado a la primera palabra, se alinee como
                    se alinee el bloque. */}
                <h3
                  className={`text-balance text-xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-2xl lg:text-3xl ${
                    derecha ? "sm:pr-2" : "sm:pl-2"
                  }`}
                >
                  <span className="mr-2.5 align-middle font-mono text-xs font-normal text-zinc-400 sm:text-sm">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step.title}
                </h3>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-[var(--hairline)] px-6 py-7 sm:flex-row sm:justify-center sm:gap-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">PUBLICA EN</p>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {CHANNELS.map((channel) => (
              <span key={channel} className="text-sm font-medium text-zinc-700">
                {channel}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
