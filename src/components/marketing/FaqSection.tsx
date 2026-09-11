"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// Las preguntas están escritas para lo que Frames vende HOY: un servicio
// donde nosotros hacemos el mes y lo publicamos. Las respuestas anteriores
// describían el autoservicio —"cancelas desde tu panel", "el cuestionario
// te toma diez minutos", "Instagram en el plan Básico... en Pro y Max"— y
// ninguna de esas tres cosas es cierta para quien contrata el servicio:
// no tiene panel, no llena un cuestionario, y los paquetes ya ni se
// llaman así. Una sección de preguntas frecuentes que contradice a la
// tabla de precios que está tres pantallas arriba no genera dudas, genera
// desconfianza.
const FAQS = [
  {
    question: "¿Necesito saber de diseño o edición?",
    answer:
      "No, y tampoco tienes que aprender ninguna herramienta. Nos cuentas de tu negocio una vez, nosotros armamos el mes, hacemos los videos y las imágenes y los subimos. Lo único que haces tú es avisarnos si algo no te late.",
  },
  {
    question: "¿El contenido se nota que está hecho con IA?",
    answer:
      "Se nota cuando está mal hecho. Por eso ninguna pieza sale sin que una persona la revise antes, y por eso te mandamos tres de muestra antes de que pagues: para que lo juzgues tú y no nosotros. Lo que sí te decimos de frente es que no vamos a ir a grabar a tu local. Si lo que necesitas es a tu gente y tu producto en cámara, eso es otra cosa y te conviene un fotógrafo.",
  },
  {
    question: "¿Es seguro darles acceso a mis redes?",
    answer:
      "Tú decides cómo. Puedes conectarnos con el inicio de sesión oficial de Instagram, Facebook o TikTok —tu contraseña nunca pasa por nosotros y nos quitas el permiso cuando quieras— o te mandamos las piezas listas por WhatsApp y las subes tú. Las dos formas funcionan igual.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí. Se paga mes con mes, sin contrato forzoso y sin penalización. Nos avisas antes de que termine tu mes y ahí queda. Lo que ya te entregamos es tuyo y te lo quedas.",
  },
  {
    question: "¿Qué pasa si no me gusta una pieza?",
    answer:
      "Nos dices cuál y la rehacemos, sin costo y sin discutirlo. Es más rápido de lo que suena: rehacer un video es cuestión de minutos, no de volver a citar a un equipo de grabación. Y entre más nos corrijas al principio, menos vas a tener que corregir después.",
  },
  {
    question: "¿Cuánto tarda en estar listo?",
    answer:
      "Las tres piezas de muestra te llegan en menos de 24 horas. Si decides seguir, primero platicamos un rato para entender bien tu negocio y de ahí te mandamos el mes completo, para que lo revises antes de que salga publicado nada.",
  },
  {
    question: "¿En qué redes publican?",
    answer:
      "Instagram en el paquete Entrada; Instagram, Facebook y TikTok en Crecimiento y Completo. Publicamos a la hora en que tu público suele estar despierto, no a la hora en que nos acordamos.",
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
