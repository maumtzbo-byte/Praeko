import Link from "next/link";
import { CalendarClock } from "lucide-react";
import AuroraBackground from "./AuroraBackground";

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden py-28">
      <AuroraBackground />
      <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-6 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h2 className="aurora-text text-balance font-[family-name:var(--font-display)] text-3xl font-semibold italic tracking-tight sm:text-4xl">
            Dedica tu tiempo a tu negocio, no a tus redes
          </h2>
          <p className="max-w-md text-zinc-600 dark:text-zinc-400">
            Onboarding de 10 minutos. El primer calendario de contenido de tu
            negocio, listo el mismo día.
          </p>
          <Link
            href="/registro"
            className="btn-shine rounded-full bg-zinc-950 px-7 py-3 text-sm font-medium text-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] transition-all hover:scale-[1.03] hover:shadow-[0_1px_0_rgba(255,255,255,0.4)_inset,0_0_0_4px_rgba(30,107,76,0.18)] dark:bg-white dark:text-zinc-950"
          >
            Empieza gratis
          </Link>
        </div>

        {/* Asymmetric visual accent — the only off-center element on an
            otherwise centered page, deliberately, so it reads as art
            direction rather than a layout that just forgot to center. */}
        <div className="mx-auto w-full max-w-xs rounded-3xl border border-[var(--hairline)] bg-white/70 p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_44px_-20px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:mx-0 sm:ml-auto dark:bg-zinc-900/70">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.08)] dark:from-zinc-700 dark:to-zinc-800">
            <CalendarClock className="h-5 w-5 text-accent" strokeWidth={1.5} />
          </span>
          <p className="mt-5 font-[family-name:var(--font-display)] text-3xl italic tracking-tight text-zinc-950 dark:text-white">
            10 min
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            de onboarding para tener tu primer calendario de contenido listo.
          </p>
        </div>
      </div>
    </section>
  );
}
