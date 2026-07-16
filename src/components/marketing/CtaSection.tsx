import Link from "next/link";
import LiquidMetalBackground from "./LiquidMetalBackground";

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden py-28">
      <LiquidMetalBackground />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="chrome-text text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Deja que tus agentes de IA hagan el marketing
        </h2>
        <p className="max-w-xl text-zinc-600">
          Onboarding de 10 minutos. El primer calendario de contenido de tu
          negocio, listo el mismo día.
        </p>
        <Link
          href="/registro"
          className="rounded-full bg-zinc-950 px-7 py-3 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] transition-transform hover:scale-[1.03]"
        >
          Empieza gratis
        </Link>
      </div>
    </section>
  );
}
