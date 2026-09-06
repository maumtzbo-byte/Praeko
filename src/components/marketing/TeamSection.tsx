"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, Radar, Wand2, ShieldCheck, Send, MessageCircle, BarChart3, type LucideIcon } from "lucide-react";

/**
 * Los siete agentes como un equipo al que se le puede preguntar, en vez de
 * una cuadrícula de tarjetas que se lee en diagonal. Cada uno habla en
 * primera persona de lo que realmente hace hoy — el Revisor de Marca y el
 * de Tendencias existen desde hace tiempo pero nunca habían aparecido en la
 * landing, que solo listaba cinco.
 *
 * Los colores son una familia derivada del azul de marca (más un ámbar para
 * el único que sirve para frenar cosas), no siete colores sueltos: dan
 * identidad a cada personaje sin romper el acento único que usa el resto
 * del producto.
 */
interface Agent {
  id: string;
  /** Nombre corto para el avatar. */
  name: string;
  /** Título completo tal como se dice. Explícito y no "Agente de " + name,
   * porque ese prefijo produce "Agente de Revisor de Marca". */
  fullName: string;
  role: string;
  icon: LucideIcon;
  color: string;
  messages: string[];
}

const AGENTS: Agent[] = [
  {
    id: "estrategia",
    name: "Estrategia",
    fullName: "Agente de Estrategia",
    role: "Decide qué se publica",
    icon: Compass,
    color: "#2f6fb0",
    messages: [
      "Yo decido qué se publica y qué día.",
      "Leo el cuestionario de tu marca — tu tono, qué vendes, a quién le vendes — y armo el plan del mes completo, con el guion de cada pieza ya escrito.",
      "Si tu plan trae 8 videos, reparto esos 8 donde más sirven. No relleno el calendario por llenarlo.",
    ],
  },
  {
    id: "tendencias",
    name: "Tendencias",
    fullName: "Agente de Tendencias",
    role: "Investiga qué está funcionando",
    icon: Radar,
    color: "#3d8f9e",
    messages: [
      "Antes de que se escriba nada, yo investigo.",
      "Busco en internet qué tipo de contenido está funcionando ahora mismo para negocios como el tuyo, en tu ciudad.",
      "Y traigo el calendario que importa: Buen Fin, Día de las Madres, la quincena. Si vendes en Estados Unidos, cambio a Black Friday y Thanksgiving.",
    ],
  },
  {
    id: "creativo",
    name: "Creativo",
    fullName: "Agente Creativo",
    role: "Produce el video y la imagen",
    icon: Wand2,
    color: "#6a5fb0",
    messages: [
      "Yo lo produzco.",
      "Tomo el guion y genero el video o la imagen de verdad — no un borrador ni una plantilla que tengas que rellenar.",
      "Uso las fotos de tu negocio que subiste como referencia, para que se parezca a ti y no a un banco de imágenes.",
    ],
  },
  {
    id: "revisor",
    name: "Revisor de Marca",
    fullName: "Agente Revisor de Marca",
    role: "Revisa antes que tú",
    icon: ShieldCheck,
    color: "#b08a3d",
    messages: [
      "Yo reviso antes que tú.",
      "Cada pieza pasa por mí: que suene a tu marca, que no diga algo que no debería, que el gancho no sea genérico.",
      "Si algo no pasa, lo marco y no llega a publicarse sin que tú lo veas primero.",
    ],
  },
  {
    id: "publicacion",
    name: "Publicación",
    fullName: "Agente de Publicación",
    role: "Sube el contenido",
    icon: Send,
    color: "#2f8f6b",
    messages: [
      "Yo la subo.",
      "Publico en Instagram, Facebook o TikTok a la hora que tiene sentido para tu giro — un restaurante antes de la comida, un gimnasio antes de la hora en que la gente entrena.",
      "Tú apruebas una vez; de ahí en adelante me encargo yo.",
    ],
  },
  {
    id: "respuestas",
    name: "Respuestas",
    fullName: "Agente de Respuestas",
    role: "Contesta a tus clientes",
    icon: MessageCircle,
    color: "#4a7fd0",
    messages: [
      "Yo contesto.",
      "Cuando alguien pregunta precio, horario o disponibilidad en tus comentarios o mensajes, respondo con la información real de tu negocio.",
      "Si la pregunta se pone seria, te la paso a ti en vez de inventar una respuesta.",
    ],
  },
  {
    id: "resultados",
    name: "Resultados",
    fullName: "Agente de Resultados",
    role: "Mide qué funcionó",
    icon: BarChart3,
    color: "#4f6a86",
    messages: [
      "Yo mido.",
      "Traigo los números reales de cada publicación: alcance, likes, comentarios, seguidores nuevos.",
      "Y te digo qué funcionó de verdad, para que el plan del mes que entra salga mejor que este.",
    ],
  },
];

export default function TeamSection() {
  const [activeId, setActiveId] = useState(AGENTS[0].id);
  const active = AGENTS.find((a) => a.id === activeId) ?? AGENTS[0];
  const ActiveIcon = active.icon;

  return (
    <section id="agentes" className="relative py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">TU NUEVO EQUIPO</p>
        <h2 className="max-w-lg text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Siete agentes. Cada uno con su trabajo.
        </h2>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-600 sm:text-base">
          Toca a cualquiera y te cuenta de qué se encarga.
        </p>

        {/* Fila con scroll lateral en celular: siete avatares no caben, y
            apilarlos rompería la lectura de "esto es un equipo". */}
        <div className="-mx-6 mt-10 flex snap-x gap-3 overflow-x-auto px-6 pb-2 sm:mx-0 sm:flex-wrap sm:justify-start sm:overflow-visible sm:px-0">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const isActive = agent.id === activeId;
            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => setActiveId(agent.id)}
                aria-pressed={isActive}
                className="flex w-[88px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl px-1 py-2 text-center transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-[104px]"
                style={{ opacity: isActive ? 1 : 0.55 }}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-transform sm:h-16 sm:w-16"
                  style={{
                    backgroundColor: `${agent.color}1a`,
                    border: `1px solid ${agent.color}${isActive ? "80" : "26"}`,
                    transform: isActive ? "scale(1.06)" : "scale(1)",
                  }}
                >
                  <Icon className="h-6 w-6" strokeWidth={1.75} style={{ color: agent.color }} />
                </span>
                <span className="text-[11px] font-medium leading-tight text-zinc-700 sm:text-xs">{agent.name}</span>
              </button>
            );
          })}
        </div>

        {/* El hilo arranca con un agente ya seleccionado, no vacío: la
            sección tiene que decir algo aunque nadie toque nada. */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-[var(--hairline)] bg-white/60 backdrop-blur-sm">
          <div className="flex items-center gap-3 border-b border-[var(--hairline)] px-5 py-4">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${active.color}1a`, border: `1px solid ${active.color}40` }}
            >
              <ActiveIcon className="h-[18px] w-[18px]" strokeWidth={1.75} style={{ color: active.color }} />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-950">{active.fullName}</p>
              <p className="text-xs text-zinc-500">{active.role}</p>
            </div>
          </div>

          <div className="flex min-h-[260px] flex-col gap-2.5 px-5 py-5 sm:min-h-[220px]">
            <AnimatePresence mode="wait">
              <motion.div key={active.id} className="flex flex-col gap-2.5">
                {active.messages.map((message, i) => (
                  <motion.p
                    key={`${active.id}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    // El escalonado imita a alguien escribiendo una tras
                    // otra; sin él las tres burbujas aparecen de golpe y
                    // deja de leerse como conversación.
                    transition={{ duration: 0.3, delay: i * 0.35, ease: "easeOut" }}
                    className="max-w-[85%] rounded-2xl rounded-tl-md px-4 py-2.5 text-sm leading-relaxed text-zinc-700 sm:max-w-[70%]"
                    style={{ backgroundColor: `${active.color}12` }}
                  >
                    {message}
                  </motion.p>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
