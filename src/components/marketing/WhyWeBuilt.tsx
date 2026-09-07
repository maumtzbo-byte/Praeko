export default function WhyWeBuilt() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 md:py-32">
      <div className="relative mx-auto max-w-5xl px-6">
        <p className="mb-8 text-xs font-semibold tracking-[0.3em] text-zinc-500">
          POR QUÉ CREAMOS FRAMES
        </p>

        {/* Asymmetric two-column split — a large pull-quote statement next
            to a tighter, rule-indented supporting paragraph — instead of
            one long column of same-size text, so there's an actual visual
            hierarchy between "the point" and "the reasoning". */}
        <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-16">
          <p className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-zinc-950 sm:text-4xl md:text-5xl">
            Creamos Frames para quien{" "}
            <span className="text-accent">no tiene tiempo</span> de hacer
            marketing. Y no debería tener que hacerlo.
          </p>

          <div className="flex flex-col gap-5 border-l border-[var(--hairline)] pl-6 text-base leading-relaxed text-zinc-600">
            <p>
              Un negocio chico ya es trabajo de sobra. Abres, atiendes,
              cobras, cierras. Cuando por fin te sientas ya son las diez de
              la noche, y a esa hora nadie tiene ganas de grabar un video,
              escribirle el texto y acordarse de subirlo.
            </p>
            <p>
              Una agencia cobra miles de pesos al mes. Aprender a hacerlo tú
              sale gratis, pero se paga con horas que no tienes. Y el negocio
              de al lado sigue subiendo algo todos los días.
            </p>
            <p>
              Por eso Frames lo hace por ti. No grabas nada, no editas nada,
              no programas nada. Solo lo revisas y{" "}
              <span className="font-medium text-zinc-950">das el visto bueno</span>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
