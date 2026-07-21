"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const FAQS = [
  {
    question: "¿Necesito saber de diseño o edición para usarlo?",
    answer:
      "No. Le cuentas a Praeko sobre tu negocio una vez, durante el onboarding, y a partir de ahí los videos, imágenes y textos se generan solos cada mes. No hay que editar nada ni aprender ninguna herramienta.",
  },
  {
    question: "¿Es seguro conectar mis redes sociales?",
    answer:
      "Sí. La conexión se hace con el inicio de sesión oficial de Meta y TikTok — nunca vemos ni guardamos tu contraseña. Solo pedimos permiso para publicar en tu nombre, y puedes desconectar cualquier cuenta cuando quieras desde tu panel.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí, sin contratos forzosos ni letra chica. Cancelas desde tu panel en cualquier momento y dejas de pagar al terminar tu ciclo actual.",
  },
  {
    question: "¿Qué pasa si no me gusta el contenido que genera?",
    answer:
      "Puedes regenerarlo o ajustar la información de tu marca (tono, productos, estilo) para que el siguiente lote salga más cerca de lo que buscas. El contenido mejora conforme afinas esos datos.",
  },
  {
    question: "¿Cuánto tarda en estar listo mi primer contenido?",
    answer:
      "El onboarding toma unos 10 minutos. El mismo día tienes tu primer calendario de contenido generado y listo para revisar antes de publicarse.",
  },
  {
    question: "¿En qué redes sociales puedo publicar?",
    answer:
      "Instagram en el plan Básico; Instagram, Facebook y TikTok en Pro y Max. Publicamos directamente en tus cuentas conectadas, a la hora en que tu público suele estar más activo.",
  },
];

function FaqItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-2xl border border-[var(--hairline)] bg-white/60 dark:bg-zinc-900/60">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:text-zinc-100 dark:hover:text-white sm:text-base"
      >
        <span>{question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-300 dark:text-zinc-400 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="preguntas" className="py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
            PREGUNTAS FRECUENTES
          </p>
          <h2 className="text-balance font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
            Antes de que te decidas
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, index) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
