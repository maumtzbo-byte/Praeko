"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { AVISO_ETIQUETA_PUBLICO } from "@/lib/marketing/etiqueta-ia";
import { AnimatePresence, motion } from "framer-motion";

// Las preguntas están escritas para lo que Frames vende HOY: video y
// escenas del producto de una marca, hechos con sus propias fotos, y
// publicados por nosotros.
//
// Dos cosas que antes no estaban y ahora sí, porque las dos cuestan dinero
// cuando faltan. La primera: qué necesitamos de ellos para empezar — una
// marca que no sabe que tiene que mandar fotos llega el día uno sin nada y
// el mes arranca tarde. La segunda: las revisiones con número. Decían "la
// rehacemos, sin costo y sin discutirlo", que con un cliente exigente se
// come el margen entero; el 68% de quien compra un paquete cerrado espera
// personalización de todos modos, así que el límite se pone por escrito
// antes de venderlo, no después.
const FAQS = [
  {
    question: "¿Qué necesitan de mí para empezar?",
    answer:
      "Las fotos de tu producto que ya tengas. Sirven las de fondo blanco y sirven las de celular. Con tres o cuatro buenas de cada producto arrancamos; si tienes catálogo completo, mejor.",
  },
  {
    question: "¿Van a inventar mi producto? ¿Se va a ver falso?",
    answer:
      "Tu foto entra y sale con la misma forma, el mismo color y el mismo nombre al frente. Lo que armamos alrededor es la mesa, la luz, la mano que lo levanta. Antes de que pagues te mandamos tres piezas con tu producto, así que esto no hay que creérnoslo: se ve.",
  },
  {
    question: "¿Instagram va a marcar mis posts como hechos con IA?",
    answer: AVISO_ETIQUETA_PUBLICO,
  },
  {
    question: "¿Hacen ropa o calzado?",
    answer:
      "No. La tela cae distinto en cada toma y ahí sí se nota la diferencia. Trabajamos con producto que mantiene su forma: frascos, bolsas, latas, cajas, joyería. Si vendes ropa te conviene alguien más, y preferimos decírtelo hoy.",
  },
  {
    question: "¿Necesito saber de diseño o edición?",
    answer:
      "No, y tampoco vas a aprender ninguna herramienta nueva. Mandas tus fotos una vez y de ahí en adelante lo único que haces es contestar si va o no va.",
  },
  {
    question: "¿Qué pasa si no me gusta una pieza?",
    answer:
      "Nos dices cuál y la rehacemos. Van tres cambios el primer mes, mientras afinamos el tono de tu marca, y dos cada mes después. En la práctica sobran. Rehacer una pieza nos toma minutos, no volver a citar a un equipo de grabación.",
  },
  {
    question: "¿Es seguro darles acceso a mis redes?",
    answer:
      "Tú decides cómo. O nos conectas con el inicio de sesión oficial de Instagram, Facebook o TikTok, donde tu contraseña nunca pasa por nosotros y nos quitas el permiso cuando quieras. O te mandamos las piezas por WhatsApp y las subes tú. A nosotros nos da igual.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí. Mes con mes, sin contrato y sin penalización. Nos avisas antes de que termine tu mes y se cancela. Las piezas que ya te entregamos te las quedas.",
  },
  {
    question: "¿Cuánto tarda en estar listo?",
    answer:
      "Las tres de muestra, menos de 24 horas. Si decides seguir, primero hablamos para entender tu marca y de ahí te mandamos el mes completo, para que lo revises antes de que salga publicado nada.",
  },
  {
    question: "¿En qué redes publican?",
    answer:
      "Instagram, Facebook y TikTok, en los tres paquetes. Publicamos a la hora en que tu gente está despierta y comprando.",
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
            Lo que siempre nos preguntan
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
