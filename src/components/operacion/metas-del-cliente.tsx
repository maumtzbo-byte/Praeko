"use client";

import { useState, useTransition } from "react";
import { Check, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fijarMeta, marcarMetaCumplida } from "@/app/clientes/metas-actions";

export type MetaDelCliente = {
  id: string;
  texto: string;
  paraFecha: string | null;
  cumplida: boolean;
  /** Cuánto lleva de avance, si la meta tiene números y hay medición.
   *  null cuando no se puede saber. */
  avance: number | null;
};

/**
 * Las metas que se acordaron con este cliente.
 *
 * Es el otro lado de los resultados: sin una meta escrita, un reporte es un
 * montón de números sin veredicto — 4,200 personas alcanzadas, ¿y eso es
 * bueno? Con la meta al lado, el mismo número contesta solo.
 *
 * Y es lo que hace que la conversación de renovación tenga de qué
 * agarrarse. El churn más caro es el del cliente que esperaba algo que
 * nunca se acordó: se va convencido de que no cumpliste y tú convencido de
 * que sí, y los dos tienen razón porque nadie escribió qué era cumplir.
 */
export function MetasDelCliente({
  businessId,
  metas,
}: {
  businessId: string;
  metas: MetaDelCliente[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, empezar] = useTransition();

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    const forma = evento.currentTarget;
    setError(null);

    empezar(async () => {
      const r = await fijarMeta({
        businessId,
        texto: formulario.get("texto"),
        metrica: formulario.get("metrica") || null,
        valorInicial: Number(formulario.get("inicial")) || null,
        valorObjetivo: Number(formulario.get("objetivo")) || null,
        paraFecha: formulario.get("fecha") || null,
      });
      if (r.success) {
        forma.reset();
        setAbierto(false);
      } else {
        setError(r.error);
      }
    });
  }

  const activas = metas.filter((m) => !m.cumplida);

  return (
    <div className="mt-4 border-t border-zinc-100 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-zinc-400">
          <Target className="h-3.5 w-3.5" strokeWidth={2} />
          Lo que acordaron
        </p>
        {!abierto && (
          <Button variant="ghost" size="sm" onClick={() => setAbierto(true)}>
            Fijar meta
          </Button>
        )}
      </div>

      {metas.length === 0 && !abierto && (
        <p className="mt-1.5 text-sm text-zinc-500">
          Sin meta acordada. Es lo que le da veredicto a los números del reporte.
        </p>
      )}

      {activas.length > 0 && (
        <ul className="mt-2 space-y-2">
          {activas.map((meta) => (
            <Meta key={meta.id} meta={meta} />
          ))}
        </ul>
      )}

      {abierto && (
        <form onSubmit={enviar} className="mt-3 space-y-3">
          <Input
            name="texto"
            required
            placeholder="En sus palabras: «que me pregunten más por DM»"
            aria-label="La meta acordada"
          />
          <div className="flex flex-wrap gap-2">
            <select
              name="metrica"
              defaultValue=""
              aria-label="Qué se mide"
              className="h-9 rounded-xl bg-white px-3 text-sm text-zinc-900 shadow-[var(--relieve-pozo)] outline-none"
            >
              <option value="">Sin número</option>
              <option value="alcance">Alcance</option>
              <option value="interacciones">Interacciones</option>
              <option value="seguidores">Seguidores</option>
              <option value="mensajes">Mensajes</option>
            </select>
            <Input name="inicial" inputMode="numeric" placeholder="Hoy" aria-label="Valor de hoy" className="h-9 w-24" />
            <Input name="objetivo" inputMode="numeric" placeholder="Meta" aria-label="Valor objetivo" className="h-9 w-24" />
            <Input name="fecha" type="date" aria-label="Para cuándo" className="h-9 w-40" />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" loading={guardando}>
              Guardar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            {error && <span className="text-sm text-red-700">{error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

function Meta({ meta }: { meta: MetaDelCliente }) {
  const [cumplida, setCumplida] = useState(meta.cumplida);
  const [marcando, empezar] = useTransition();

  function cumplir() {
    setCumplida(true);
    empezar(async () => {
      const r = await marcarMetaCumplida({ metaId: meta.id });
      if (!r.success) setCumplida(false);
    });
  }

  if (cumplida) {
    return (
      <li className="flex items-center gap-2 text-sm text-emerald-700">
        <Check className="h-3.5 w-3.5" />
        {meta.texto}
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-800">
      <span className="min-w-0 flex-1">{meta.texto}</span>
      {meta.avance !== null && (
        <span className="shrink-0 text-xs tabular-nums text-zinc-500">
          {Math.round(meta.avance)}%
        </span>
      )}
      {meta.paraFecha && (
        <span className="shrink-0 text-xs text-zinc-400">para {meta.paraFecha}</span>
      )}
      <Button size="sm" variant="ghost" onClick={cumplir} loading={marcando}>
        Cumplida
      </Button>
    </li>
  );
}
