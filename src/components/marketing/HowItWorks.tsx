"use client";

import { motion } from "framer-motion";
import { ClipboardList, Sparkles, ThumbsUp, Send } from "lucide-react";

// Los cuatro pasos reales del producto, no una narrativa aspiracional: el
// cuestionario de onboarding, la generación por agentes, la aprobación en
// Publicaciones y la publicación a las redes conectadas. Cada uno existe
// hoy y se puede recorrer en la app.
const STEPS = [
  {
    icon: ClipboardList,
    title: "Cuéntanos de tu negocio",
    description:
      "Un cuestionario de una sola vez: tu giro, tu tono, qué vendes y a quién. Es todo lo que los agentes necesitan para dejar de sonar genéricos.",
  },
  {
    icon: Sparkles,
    title: "Los agentes arman tu mes",
    description:
      "Estrategia, guion y la pieza terminada — video, imagen o carrusel — con las fechas que importan en México ya consideradas.",
  },
  {
    icon: ThumbsUp,
    title: "Tú apruebas",
    description:
      "Ves lo que se generó antes de que salga. Cambias lo que no te lata; lo demás queda listo con un toque.",
  },
  {
    icon: Send,
    title: "Se publica solo",
    description:
      "A tus redes conectadas, a la hora recomendada para tu tipo de negocio. Y los comentarios que lleguen también se contestan.",
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

        {/* Una línea conecta los pasos porque aquí la numeración sí es
            información: es una secuencia real, no un adorno. Vertical en
            celular, horizontal en escritorio. */}
        <div className="mt-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === STEPS.length - 1;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
                  className="relative flex items-start gap-4 md:flex-col md:gap-0"
                >
                  {/* Un conector por paso en vez de una sola línea que
                      atraviese todo: así el último paso no arrastra una
                      línea que sigue hacia la nada, que se lee como si
                      faltara un quinto paso. El tramo cubre exactamente el
                      hueco hasta el siguiente ícono (gap-8 en celular,
                      gap-6 en escritorio). */}
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[27px] top-14 h-8 w-px bg-[var(--hairline)] md:left-14 md:top-[27px] md:h-px md:w-[calc(100%-3.5rem+1.5rem)]"
                    />
                  )}
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--hairline)] bg-[var(--background)]">
                    <Icon className="h-5 w-5 text-accent" strokeWidth={1.75} />
                  </div>
                  <div className="md:mt-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
                      <h3 className="text-base font-semibold text-zinc-950">{step.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-500">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
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
