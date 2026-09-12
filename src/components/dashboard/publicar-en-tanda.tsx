"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, Loader2, Send, X } from "lucide-react";

import { publishContentNow } from "@/app/dashboard/publicaciones/actions";
import { diaCorto } from "@/lib/aprobacion/liga";
import { Button } from "@/components/ui/button";
import { PlasticPanel } from "@/components/dashboard/plastic-panel";

/**
 * Publicar el mes aprobado de un jalón.
 *
 * Era el último hueco del ciclo de entrega: el cliente ya podía aprobar su
 * mes desde una liga, pero del otro lado había que publicar pieza por
 * pieza, a mano, doce veces. Con eso, el mes aprobado se quedaba sin
 * publicar los días que nadie tuviera una hora libre.
 *
 * EL LAZO VIVE EN EL NAVEGADOR, NO EN EL SERVIDOR, y no es capricho:
 * `publishContentNow` espera en línea a que Meta termine de procesar el
 * contenedor de Instagram (ver waitForInstagramContainerReady), lo que para
 * un video real son decenas de segundos. La página declara `maxDuration =
 * 60`, que es el máximo del plan Hobby de Vercel. Doce videos en una sola
 * server action revientan ese límite sin discusión.
 *
 * Llamando una vez por pieza desde aquí, cada publicación es su propia
 * petición con su propio presupuesto de tiempo. Y como cada una se registra
 * al terminar, una tanda interrumpida a la mitad deja seis piezas
 * publicadas de verdad en vez de doce a medias.
 */

export type PiezaPublicable = {
  id: string;
  titulo: string;
  fecha: string;
  veredicto: "aprobado" | "cambios" | null;
};

export type CuentaConectada = {
  id: string;
  plataforma: "instagram" | "facebook" | "tiktok";
  nombre: string | null;
};

const PLATAFORMAS: Record<CuentaConectada["plataforma"], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

type Resultado = { id: string; ok: boolean; error?: string };

export function PublicarEnTanda({
  piezas,
  cuentas,
}: {
  piezas: PiezaPublicable[];
  cuentas: CuentaConectada[];
}) {
  const aprobadas = useMemo(() => piezas.filter((p) => p.veredicto === "aprobado"), [piezas]);
  const sinRevisar = useMemo(() => piezas.filter((p) => p.veredicto === null), [piezas]);
  /** Las que el cliente mandó cambiar NO se ofrecen, ni apagadas.
   *
   *  Publicar una pieza que el cliente pidió rehacer es el peor error
   *  posible de este panel: rompe exactamente la promesa que la liga de
   *  aprobación acaba de hacerle. Que ni siquiera aparezcan como casilla
   *  es más seguro que dejarlas apagadas esperando un clic distraído. */
  const conCambios = useMemo(() => piezas.filter((p) => p.veredicto === "cambios"), [piezas]);

  // Arrancan marcadas las aprobadas y apagadas las que el cliente no ha
  // visto: publicar sin su visto bueno es justo lo que la liga existe para
  // evitar, pero prohibirlo dejaría inservible el panel de quien todavía
  // no manda ligas.
  const [elegidas, setElegidas] = useState<string[]>(() => aprobadas.map((p) => p.id));
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id ?? "");
  const [enCurso, setEnCurso] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [corriendo, setCorriendo] = useState(false);

  const hechas = resultados.filter((r) => r.ok).length;
  const fallidas = resultados.filter((r) => !r.ok);

  function alternar(id: string) {
    setElegidas((previo) =>
      previo.includes(id) ? previo.filter((x) => x !== id) : [...previo, id],
    );
  }

  async function publicar() {
    if (!cuentaId || elegidas.length === 0) return;
    setCorriendo(true);
    setResultados([]);

    for (const id of elegidas) {
      setEnCurso(id);
      try {
        const res = await publishContentNow(id, cuentaId);
        setResultados((previo) => [
          ...previo,
          res.success ? { id, ok: true } : { id, ok: false, error: res.error },
        ]);
      } catch {
        setResultados((previo) => [
          ...previo,
          { id, ok: false, error: "Se cortó la conexión antes de terminar." },
        ]);
      }
      // Una que falla NO detiene la tanda. Casi siempre es una pieza
      // concreta —un video que Meta rechazó, un token vencido de una sola
      // cuenta— y parar las once restantes por ella deja el mes a medio
      // publicar sin ninguna razón.
    }

    setEnCurso(null);
    setCorriendo(false);
  }

  if (piezas.length === 0 && conCambios.length === 0) return null;

  const sinCuentas = cuentas.length === 0;

  return (
    <PlasticPanel relieve="neutro" className="mb-6 p-5 sm:p-6">
      <div className="flex items-start gap-3.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-accent"
          style={{
            background: "linear-gradient(180deg,#f7fafd 0%,#e8eff6 100%)",
            boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(31,62,92,0.10)",
          }}
        >
          <Send className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-zinc-950">
            Publicar el mes de un jalón
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">
            {aprobadas.length > 0
              ? `${aprobadas.length} ${aprobadas.length === 1 ? "pieza aprobada" : "piezas aprobadas"} por tu cliente y listas para salir.`
              : "Ninguna pieza tiene el visto bueno del cliente todavía."}
          </p>
        </div>
      </div>

      {conCambios.length > 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] leading-snug text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          <span>
            {conCambios.length === 1
              ? "Hay 1 pieza con cambios pedidos. No aparece aquí: primero se rehace."
              : `Hay ${conCambios.length} piezas con cambios pedidos. No aparecen aquí: primero se rehacen.`}
          </span>
        </p>
      )}

      {sinCuentas ? (
        <p className="mt-3 text-sm text-zinc-600">
          Conecta una red social para poder publicar desde aquí.
        </p>
      ) : (
        <>
          {cuentas.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {cuentas.map((cuenta) => (
                <button
                  key={cuenta.id}
                  type="button"
                  onClick={() => setCuentaId(cuenta.id)}
                  disabled={corriendo}
                  className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-all ${
                    cuentaId === cuenta.id
                      ? "bg-zinc-950 text-white"
                      : "bg-[image:var(--plastico)] text-zinc-700 shadow-[var(--relieve-pieza)]"
                  }`}
                >
                  {PLATAFORMAS[cuenta.plataforma]}
                  {cuenta.nombre ? ` · ${cuenta.nombre}` : ""}
                </button>
              ))}
            </div>
          )}

          <ul className="mt-4 flex flex-col gap-1.5">
            {[...aprobadas, ...sinRevisar].map((pieza) => {
              const marcada = elegidas.includes(pieza.id);
              const resultado = resultados.find((r) => r.id === pieza.id);
              return (
                <li key={pieza.id}>
                  <button
                    type="button"
                    onClick={() => alternar(pieza.id)}
                    disabled={corriendo}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-zinc-50 disabled:hover:bg-transparent"
                  >
                    <span
                      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md ${
                        marcada ? "bg-accent text-white" : "bg-zinc-200"
                      }`}
                      style={{ height: 18, width: 18 }}
                    >
                      {marcada && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-800">
                      {pieza.titulo}
                    </span>
                    <span className="shrink-0 text-[11px] text-zinc-500">
                      {diaCorto(pieza.fecha)}
                    </span>
                    {pieza.veredicto === null && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                        sin revisar
                      </span>
                    )}
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {enCurso === pieza.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-500" />}
                      {resultado?.ok && <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} />}
                      {resultado && !resultado.ok && <X className="h-3.5 w-3.5 text-red-600" strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <Button
            onClick={() => void publicar()}
            loading={corriendo}
            disabled={elegidas.length === 0 || !cuentaId}
            size="sm"
            className="mt-4"
          >
            {corriendo
              ? `Publicando ${resultados.length + 1} de ${elegidas.length}…`
              : `Publicar ${elegidas.length} ${elegidas.length === 1 ? "pieza" : "piezas"}`}
          </Button>

          {resultados.length > 0 && !corriendo && (
            <div className="mt-3 text-[13px] leading-snug">
              <p className="font-medium text-zinc-800">
                {hechas} de {resultados.length} publicadas.
              </p>
              {/* El error va por pieza y con su motivo. Un "algo falló" en
                  una tanda de doce obliga a revisarlas una por una en la
                  red social para saber cuál quedó. */}
              {fallidas.map((f) => {
                const pieza = piezas.find((p) => p.id === f.id);
                return (
                  <p key={f.id} className="mt-1 text-red-700">
                    <span className="font-medium">{pieza?.titulo}:</span> {f.error}
                  </p>
                );
              })}
              {fallidas.length > 0 && (
                <p className="mt-2 text-zinc-500">
                  Las que fallaron siguen sin publicar. Puedes volver a intentarlo con ellas.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </PlasticPanel>
  );
}
