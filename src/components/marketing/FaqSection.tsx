"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const FAQS = [
  {
    question: "¿Necesito saber de diseño o edición para usarlo?",
    answer:
      "No. Le cuentas a Frames sobre tu negocio una vez, durante el onboarding, y a partir de ahí los videos, imágenes y textos se generan solos cada mes. No hay que editar nada ni aprender ninguna herramienta.",
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

function FaqItem({
  question,
  answer,
  index,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border transition-colors duration-300 ${
        isOpen
          ? "border-accent/25 bg-white shadow-[0_2px_4px_rgba(0,0,0,0.06),0_24px_45px_-26px_rgba(0,0,0,0.25)] "
          : "border-[var(--hairline)] bg-white/60"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-4 px-5 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-7"
      >
        <span
          className={`shrink-0 font-mono text-sm tracking-tight transition-colors ${
            isOpen ? "text-accent" : "text-zinc-400"
          }`}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={`flex-1 text-sm font-medium transition-colors sm:text-base ${
            isOpen ? "text-zinc-950" : "text-zinc-800"
          }`}
        >
          {question}
        </span>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
            isOpen
              ? "rotate-45 border-accent bg-accent text-white"
              : "border-zinc-300 text-zinc-500 "
          }`}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
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
            <p className="px-5 pb-6 pl-[3.25rem] text-sm leading-relaxed text-zinc-600 sm:px-7 sm:pl-[3.75rem]">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="preguntas" className="relative overflow-hidden py-16 sm:py-28">
      <div className="relative mx-auto max-w-3xl px-6">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">
            PREGUNTAS FRECUENTES
          </p>
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">
            Antes de que te decidas
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, index) => (
            <FaqItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
