import Link from "next/link";
import { CalendarClock } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-28">
      <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-6 sm:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Dedica tu tiempo a tu negocio, no a tus redes
          </h2>
          <p className="max-w-md text-zinc-600">
            Te hacemos tres piezas para tu negocio y te las mandamos en menos
            de 24 horas. Sin costo y sin compromiso.
          </p>
          <Link
            href="/prueba"
            className="rounded-full bg-zinc-950 px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 "
          >
            Ver mis 3 piezas
          </Link>
          <p className="text-xs text-zinc-500">Desde $4,900 al mes. Sin contratos forzosos.</p>
        </div>

        {/* Asymmetric visual accent — the only off-center element on an
            otherwise centered page, deliberately, so it reads as art
            direction rather than a layout that just forgot to center. */}
        <div className="mx-auto w-full max-w-xs rounded-2xl border border-[var(--hairline)] bg-[var(--background)] p-7 sm:mx-0 sm:ml-auto">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-100">
            <CalendarClock className="h-5 w-5 text-accent" strokeWidth={1.5} />
          </span>
          <p className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">
            10 min
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            es lo que tardas en pedirlas. Nosotros hacemos el resto.
          </p>
        </div>
      </div>
    </section>
  );
}
