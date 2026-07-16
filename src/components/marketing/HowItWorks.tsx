const steps = [
  {
    n: "1",
    title: "Cuéntanos de tu negocio",
    description:
      "Responde un cuestionario corto y sube fotos de tu negocio o productos. Si tienes sitio web, pega la URL y precargamos colores, logo y tono.",
  },
  {
    n: "2",
    title: "Praeko arma tu calendario",
    description:
      "El agente de estrategia propone qué publicar cada día del mes — tema, formato y guion — respetando el presupuesto de tu plan.",
  },
  {
    n: "3",
    title: "Se genera y se revisa",
    description:
      "Cada pieza se genera en imagen o video con tu marca, pasa por un agente revisor de calidad y solo avanza si de verdad está lista.",
  },
  {
    n: "4",
    title: "Se publica y mides resultados",
    description:
      "Praeko publica en tus redes en el horario recomendado y traduce alcance, seguidores y engagement a lenguaje de negocio.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="relative border-y border-[var(--hairline)] bg-white/40 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-zinc-500">
            CÓMO FUNCIONA
          </p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            De cero a publicado, sin que tengas que diseñar nada
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.n} className="relative">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-white via-zinc-200 to-zinc-400 font-mono text-sm font-semibold text-zinc-800 shadow-[0_1px_2px_rgba(0,0,0,0.2)_inset,0_4px_10px_rgba(0,0,0,0.12)]">
                {step.n}
              </div>
              <h3 className="mb-2 text-base font-semibold text-zinc-900">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-600">
                {step.description}
              </p>
              {i < steps.length - 1 && (
                <div className="absolute right-[-1.25rem] top-6 hidden h-px w-8 bg-[var(--hairline)] lg:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
