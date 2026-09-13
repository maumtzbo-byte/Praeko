import { TrendingUp } from "lucide-react";

export type ComoNosFue = {
  /** Cuántas piezas se publicaron en el periodo medido. */
  publicadas: number;
  /** Alcance sumado. null si la plataforma no lo devolvió. */
  alcance: number | null;
  /** Likes + comentarios + veces compartida. */
  interacciones: number | null;
  /** La pieza que mejor funcionó. */
  mejor: { titulo: string; interacciones: number | null } | null;
  /** Cambio contra el periodo anterior, en porcentaje. null si no hay con
   *  qué comparar todavía. */
  cambio: number | null;
};

/**
 * Cómo le fue al mes anterior, arriba de las piezas por aprobar.
 *
 * Este es el único lugar donde ponerlo. Las PyMEs que reciben reportes
 * regulares de desempeño retienen 38% más que las que no — y ese número es
 * tan difícil de cobrar en la práctica porque un reporte mensual por correo
 * no lo abre nadie.
 *
 * La liga de aprobación sí la abren: tienen que aprobar. Meter la prueba
 * dentro de la única pantalla que ya visitan convierte un reporte que se
 * ignora en uno que se lee completo, y encima llega en el momento exacto en
 * que están decidiendo si esto vale lo que pagan.
 *
 * No se pinta si no hay nada medido. Un panel de resultados en ceros, en la
 * pantalla donde el cliente decide si sigue contigo, hace daño en vez de
 * bien.
 */
export function ComoNosFueEnElMes({ datos }: { datos: ComoNosFue }) {
  if (datos.publicadas === 0) return null;

  const numero = (n: number | null) =>
    n === null ? "—" : n.toLocaleString("es-MX");

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[var(--relieve-pieza)]">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <TrendingUp className="h-4 w-4 text-accent" strokeWidth={2} />
        Cómo te fue el mes pasado
      </h2>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-zinc-400">Publicamos</dt>
          <dd className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900">
            {datos.publicadas}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-zinc-400">Te vieron</dt>
          <dd className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900">
            {numero(datos.alcance)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-zinc-400">Reaccionaron</dt>
          <dd className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-xl font-semibold tabular-nums text-zinc-900">
              {numero(datos.interacciones)}
            </span>
            {datos.cambio !== null && (
              <span
                className={`text-xs font-medium ${datos.cambio >= 0 ? "text-emerald-700" : "text-zinc-500"}`}
              >
                {datos.cambio >= 0 ? "+" : ""}
                {Math.round(datos.cambio)}%
              </span>
            )}
          </dd>
        </div>
      </dl>

      {datos.mejor && (
        <p className="mt-3.5 border-t border-zinc-100 pt-3 text-sm text-zinc-600">
          La que más jaló:{" "}
          <span className="font-medium text-zinc-900">{datos.mejor.titulo}</span>
          {datos.mejor.interacciones !== null && (
            <span className="text-zinc-500">
              {" "}
              · {datos.mejor.interacciones.toLocaleString("es-MX")} interacciones
            </span>
          )}
        </p>
      )}
    </section>
  );
}
