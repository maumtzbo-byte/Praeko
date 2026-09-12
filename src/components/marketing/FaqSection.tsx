"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
      "Las fotos de tu producto que ya tengas, aunque sean de fondo blanco o tomadas con celular. Con eso nos basta: de ahí sale la escena y el video. Si tienes catálogo, mejor, pero con tres o cuatro fotos buenas de cada producto arrancamos.",
  },
  {
    question: "¿Van a inventar mi producto? ¿Se va a ver falso?",
    answer:
      "Tu producto es tu foto y no se toca: entra con su forma y su etiqueta y sale igual. Lo que generamos es lo de alrededor — la mesa, la luz, la mano, el movimiento de cámara. Es lo mismo que hace una marca grande cuando lleva su producto a un estudio, nada más que sin agendar el estudio. Y antes de que pagues te mandamos tres piezas con tu producto para que lo veas tú, no para que nos creas.",
  },
  {
    question: "¿Hacen ropa o calzado?",
    answer:
      "No, y es a propósito. La tela se dobla y cae distinto en cada toma, y ahí la diferencia se nota. Trabajamos con producto de forma rígida: frascos, bolsas, latas, cajas, piezas de joyería. Si vendes ropa, preferimos decírtelo ahora que cobrarte y quedarte mal.",
  },
  {
    question: "¿Necesito saber de diseño o edición?",
    answer:
      "No, y tampoco tienes que aprender ninguna herramienta. Nos mandas tus fotos una vez, nosotros armamos el mes, hacemos los videos y las escenas y los subimos. Lo único que haces tú es avisarnos si algo no te late.",
  },
  {
    question: "¿Qué pasa si no me gusta una pieza?",
    answer:
      "Nos dices cuál y la rehacemos. Van tres cambios incluidos el primer mes, mientras agarramos tu estilo, y dos cada mes después — que en la práctica alcanzan de sobra. Rehacer una pieza es cuestión de minutos, no de volver a citar a un equipo de grabación.",
  },
  {
    question: "¿Es seguro darles acceso a mis redes?",
    answer:
      "Tú decides cómo. Puedes conectarnos con el inicio de sesión oficial de Instagram, Facebook o TikTok —tu contraseña nunca pasa por nosotros y nos quitas el permiso cuando quieras— o te mandamos las piezas listas por WhatsApp y las subes tú. Las dos formas funcionan igual.",
  },
  {
    question: "¿Puedo cancelar cuando quiera?",
    answer:
      "Sí. Se paga mes con mes, sin contrato forzoso y sin penalización. Nos avisas antes de que termine tu mes y ahí queda. Las piezas que ya te entregamos son tuyas y te las quedas.",
  },
  {
    question: "¿Cuánto tarda en estar listo?",
    answer:
      "Las tres piezas de muestra te llegan en menos de 24 horas. Si decides seguir, primero platicamos un rato para entender tu marca y de ahí te mandamos el mes completo, para que lo revises antes de que salga publicado nada.",
  },
  {
    question: "¿En qué redes publican?",
    answer:
      "Instagram, Facebook y TikTok, en los tres paquetes. Publicamos a la hora en que tu público suele estar despierto, no a la hora en que nos acordamos.",
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
