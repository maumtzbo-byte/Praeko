const AGENTS = [
  {
    title: "Agente de Estrategia",
    description: "Aprende el tono, los productos y el público de tu negocio, y arma el plan de contenido del mes.",
  },
  {
    title: "Agente Creativo",
    description: "Escribe el guion y genera cada video, imagen o carrusel — listo para publicar, no un borrador.",
  },
  {
    title: "Agente de Publicación",
    description: "Programa y publica cada pieza en el horario recomendado para tu tipo de negocio.",
  },
  {
    title: "Agente de Respuestas",
    description: "Contesta precio, horario y disponibilidad en tus comentarios y mensajes directos.",
  },
  {
    title: "Agente de Resultados",
    description: "Mide qué contenido funciona de verdad y lo traduce a números que puedes entender.",
  },
];

export default function WhatWeDo() {
  return (
    <section id="agentes" className="relative py-16 sm:py-24 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">QUÉ HACEMOS</p>
        <h2 className="max-w-md text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
          Cinco agentes, un negocio que se publica solo
        </h2>

        {/* A plain numbered grid, not a rotating 3D ring — each agent gets
            an index instead of a large watermark icon, and a hairline
            border does the separating instead of a per-card gradient. */}
        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--hairline)] bg-[var(--hairline)] sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent, i) => (
            <div
              key={agent.title}
              className={`flex flex-col gap-4 bg-[var(--background)] p-6 sm:p-8 ${i === AGENTS.length - 1 ? "sm:col-span-2" : ""}`}
            >
              <span className="font-mono text-xs text-zinc-400">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="text-base font-semibold text-zinc-950">{agent.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{agent.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
