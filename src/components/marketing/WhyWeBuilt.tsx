export default function WhyWeBuilt() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div className="relative mx-auto max-w-5xl px-6">
        <p className="mb-8 text-xs font-semibold tracking-[0.3em] text-zinc-500 dark:text-zinc-400">
          POR QUÉ CREAMOS FRAMES
        </p>

        {/* Asymmetric two-column split — a large pull-quote statement next
            to a tighter, rule-indented supporting paragraph — instead of
            one long column of same-size text, so there's an actual visual
            hierarchy between "the point" and "the reasoning". */}
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
          <p className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-4xl md:text-5xl dark:text-white">
            Creamos Frames para los negocios que{" "}
            <span className="text-accent">no tienen tiempo</span> para el
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
