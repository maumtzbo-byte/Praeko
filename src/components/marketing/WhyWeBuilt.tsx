export default function WhyWeBuilt() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* The rest of the page alternates flat light/dark section
          backgrounds — this one breaks that pattern with a pair of soft
          ambient shapes instead, so the "manifesto" moment reads as an
          editorial break rather than another plain block. */}
      <div aria-hidden="true" className="liquid-blob absolute -left-28 top-16 h-72 w-72 opacity-[0.16]" style={{ background: "var(--accent)" }} />
      <div aria-hidden="true" className="liquid-blob absolute -right-20 bottom-8 h-64 w-64 opacity-[0.14]" style={{ background: "var(--aurora-highlight)", animationDelay: "-9s" }} />

      <div className="relative mx-auto max-w-5xl px-6">
        <p className="mb-8 text-xs font-semibold tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
          POR QUÉ CREAMOS PRAEKO
        </p>

        {/* Asymmetric two-column split — a large pull-quote statement next
            to a tighter, rule-indented supporting paragraph — instead of
            one long column of same-size text, so there's an actual visual
            hierarchy between "the point" and "the reasoning". */}
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
          <p className="text-balance font-[family-name:var(--font-display)] text-3xl italic leading-[1.15] tracking-tight text-zinc-950 sm:text-4xl md:text-5xl dark:text-white">
            Creamos Praeko para los negocios que{" "}
            <span className="aurora-text">no tienen tiempo</span> para el
            marketing — ni deberían tener que hacerlo.
          </p>

          <div className="flex flex-col gap-5 border-l border-[var(--hairline)] pl-6 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            <p>
              Administrar un negocio pequeño ya es suficiente trabajo. Entre
              atender clientes, llevar las cuentas y mantener todo
              funcionando, no queda tiempo para grabar, editar, escribir el
              texto perfecto y publicarlo a la hora correcta — todos los
              días, en varias redes a la vez.
            </p>
            <p>
              Contratar una agencia cuesta miles de pesos al mes. Aprenderlo
              tú mismo cuesta el tiempo que simplemente no tienes. Mientras
              tanto, tu competencia sigue publicando.
            </p>
            <p>
              Por eso construimos agentes de IA que hacen ese trabajo por ti,
              todos los días, sin que grabes, edites ni programes nada — para
              devolverte{" "}
              <span className="font-medium text-zinc-950 dark:text-white">tu tiempo y tu dinero</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
