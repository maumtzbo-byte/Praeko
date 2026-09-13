import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { esOperador } from "@/lib/operacion/acceso";
import { margenes, siFueraConKling, TASA_DE_REGENERACION } from "@/lib/plans/margen";
import { PESOS_POR_DOLAR, TIPO_DE_CAMBIO_AL } from "@/lib/providers/generation/tarifas";

export const metadata: Metadata = { title: "Márgenes", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-MX")}`;

export default async function MargenesPage() {
  if (!(await esOperador())) notFound();

  const lista = margenes();

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        Qué te cuesta producir cada paquete
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Con las tarifas reales de fal.ai y {Math.round(TASA_DE_REGENERACION * 100)}% de
        regeneraciones encima. Tipo de cambio: {PESOS_POR_DOLAR} pesos por dólar,{" "}
        {TIPO_DE_CAMBIO_AL}. No incluye tu tiempo, que es el costo que de verdad limita
        cuántos clientes caben.
      </p>

      <div className="mt-8 space-y-4">
        {lista.map((m) => {
          const alterno = siFueraConKling(m);
          // Más del 20% del precio en generar es la señal: los otros dos
          // paquetes andan abajo del 10%, así que un paquete que se dispara
          // no es "el caro", es uno que está mal configurado.
          const caro = m.porcentaje > 20;

          return (
            <article
              key={m.paquete.nombre}
              className="rounded-2xl bg-white p-5 shadow-[var(--relieve-pieza)] sm:p-6"
            >
              <header className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold text-zinc-900">{m.paquete.nombre}</h2>
                <span className="text-sm text-zinc-500">
                  {pesos(m.paquete.precio)} al mes · {m.paquete.videos} videos ·{" "}
                  {m.segundos} segundos
                </span>
              </header>

              <div className="mt-4 grid gap-4 border-t border-zinc-100 pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Generar te cuesta
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-zinc-900">
                    {pesos(m.costoReal)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Del precio
                  </p>
                  <p
                    className={`mt-0.5 text-xl font-semibold ${caro ? "text-red-700" : "text-emerald-700"}`}
                  >
                    {m.porcentaje.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                    Te queda
                  </p>
                  <p className="mt-0.5 text-xl font-semibold text-zinc-900">{pesos(m.bruto)}</p>
                </div>
              </div>

              {alterno && (
                <div className="mt-4 rounded-xl bg-amber-50 p-4 shadow-[var(--relieve-hundido)]">
                  <p className="text-sm font-medium text-amber-900">
                    Este paquete usa Seedance, que cuesta 117% más por segundo y entrega
                    720p contra los 1080p de Kling.
                  </p>
                  <p className="mt-2 text-sm text-amber-800">
                    No es un error: Kling no pasa de {alterno.segundosPorVideo} segundos, y
                    lo que Completo promete es «mayor duración». El modelo caro es el precio
                    de ese diferenciador.
                  </p>
                  <p className="mt-2 text-sm text-amber-800">
                    Con {m.paquete.videos} videos de {alterno.segundosPorVideo} s en Kling a
                    1080p costaría <strong>{pesos(alterno.costoReal)}</strong> (
                    {alterno.porcentaje.toFixed(1)}% del precio):{" "}
                    <strong>{pesos(alterno.ahorro)} menos al mes por cliente</strong>. Con 20
                    clientes en este paquete son {pesos(alterno.ahorro * 20 * 12)} al año.
                  </p>
                  <p className="mt-2 text-sm text-amber-800">
                    La decisión no es de modelo, es de qué diferencia a Completo: videos más
                    largos a 720p, o los mismos videos a 1080p.
                  </p>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="mt-8 max-w-2xl text-xs text-zinc-500">
        Las tarifas están escritas a mano en{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5">
          src/lib/providers/generation/tarifas.ts
        </code>{" "}
        y verificadas contra fal.ai el 11 de septiembre de 2026. Si fal.ai las mueve, esta
        pantalla queda vieja sin avisar.
      </p>
    </main>
  );
}
