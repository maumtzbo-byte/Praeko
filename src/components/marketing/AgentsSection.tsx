import {
  Building2,
  CalendarClock,
  PenLine,
  Clapperboard,
  ShieldCheck,
  Send,
  MessageCircleQuestion,
  BarChart3,
} from "lucide-react";

const agents = [
  {
    icon: Building2,
    step: "01",
    title: "Agente de negocio",
    description:
      "Aprende tu marca a partir de un cuestionario y fotos de tu negocio: tono, público, servicios y precios. Queda como contexto persistente y editable.",
  },
  {
    icon: CalendarClock,
    step: "02",
    title: "Agente de estrategia",
    description:
      "Decide qué contenido toca cada día — tema, formato y duración — y sugiere el mejor horario de publicación según tu marca y calendario.",
  },
  {
    icon: PenLine,
    step: "03",
    title: "Agente de guiones",
    description:
      "Escribe el copy o guion de cada pieza siguiendo la estrategia del día, en el tono exacto de tu marca.",
  },
  {
    icon: Clapperboard,
    step: "04",
    title: "Agente de generación visual",
    description:
      "Convierte el guion en imagen o video real, con audio nativo y subtítulos quemados cuando tu plan lo incluye.",
  },
  {
    icon: ShieldCheck,
    step: "05",
    title: "Agente revisor de calidad",
    description:
      "Evalúa cada pieza contra tu perfil de marca antes de aprobarla. Si algo no calza, la marca para revisión humana en vez de dejarla pasar.",
  },
  {
    icon: Send,
    step: "06",
    title: "Agente de publicación",
    description:
      "Adapta cada pieza a las redes conectadas y la publica automáticamente en el horario recomendado.",
  },
  {
    icon: MessageCircleQuestion,
    step: "07",
    title: "Agente de respuesta a comentarios",
    description:
      "Responde únicamente preguntas de compradores potenciales — precio, horario, disponibilidad. Todo lo demás se marca para tu revisión.",
  },
  {
    icon: BarChart3,
    step: "08",
    title: "Dashboard de resultados",
    description:
      "Alcance, seguidores y engagement, comparados mes contra mes y traducidos a lenguaje de negocio.",
  },
];

export default function AgentsSection() {
  return (
    <section id="agentes" className="relative py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">
            EL CICLO DIARIO
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            8 agentes de IA trabajando por tu marca, todos los días
          </h2>
          <p className="mt-4 text-zinc-600">
            Desde entender tu negocio hasta publicar y medir resultados — Praeko
            corre el ciclo completo sin que tengas que abrir quince apps distintas.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-2 lg:grid-cols-4">
          {agents.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="group relative flex flex-col gap-4 bg-[var(--background)] p-7 transition-colors hover:bg-white"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.08)]">
                  <Icon className="h-5 w-5 text-zinc-700" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-xs text-zinc-400">{step}</span>
              </div>
              <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
              <p className="text-sm leading-relaxed text-zinc-600">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
