import Link from "next/link";
import { Clapperboard, ImageIcon, ChevronRight, CalendarPlus } from "lucide-react";

import { PlasticPanel, PressedChip } from "@/components/dashboard/plastic-panel";
import { FORMAT_LABELS, STATUS_LABELS } from "@/lib/content/labels";
import { Button } from "@/components/ui/button";
import type { Tables } from "@/lib/supabase/types";

export type PiezaEnCola = Pick<
  Tables<"content_calendar">,
  "id" | "topic" | "scheduled_date" | "recommended_publish_time" | "content_kind" | "format" | "status"
>;

/**
 * "¿Qué va a salir?" — la cola de lo que viene.
 *
 * El inicio contaba las piezas programadas y nunca las mostraba
 * (`String(scheduledCount)`), y "Actividad reciente" ordena hacia atrás: la
 * pantalla principal enseñaba el pasado y escondía lo que estaba por pasar.
 * Buffer y Later abren con la cola justamente porque es la prueba de que la
 * herramienta está trabajando. Aquí es más fuerte todavía: ver que el jueves
 * sale algo sin que hayas hecho nada ES la promesa de Frames.
 *
 * No se anuncia en qué red va a salir cada pieza porque el dato no existe
 * hasta que se publica: `published_platform` se llena al publicar, no al
 * programar. Poner un logo de Instagram aquí sería inventar.
 */
const DIA_CORTO = new Intl.DateTimeFormat("es-MX", { weekday: "short", timeZone: "UTC" });
const NUM_DIA = new Intl.DateTimeFormat("es-MX", { day: "numeric", timeZone: "UTC" });

/** El estado en palabras del dueño, no del sistema. "Pendiente" y
 *  "Generada" describen el pipeline; lo que él necesita saber es si le toca
 *  a él o no. */
const QUE_SIGUE: Record<PiezaEnCola["status"], { texto: string; tono: "pendiente" | "neutro" }> = {
  en_revision: { texto: "Espera tu visto bueno", tono: "pendiente" },
  pendiente: { texto: "Por generarse", tono: "neutro" },
  generada: { texto: "Lista para salir", tono: "neutro" },
  publicada: { texto: STATUS_LABELS.publicada, tono: "neutro" },
  fallida: { texto: STATUS_LABELS.fallida, tono: "pendiente" },
};

export function UpcomingQueue({ piezas }: { piezas: PiezaEnCola[] }) {
  if (piezas.length === 0) {
    return (
      <PlasticPanel relieve="neutro" className="p-5 sm:p-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-zinc-950">Nada en cola todavía</h2>
          {/* Sin "sin datos" y sin guiones: se dice qué llena este hueco y
              qué hay que hacer para llenarlo. */}
          <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
            Cuando tus agentes armen el mes, aquí vas a ver qué sale y qué día, sin que tengas que abrir nada más.
          </p>
          <Link href="/dashboard/publicaciones" className="self-start">
            <Button size="sm">
              <CalendarPlus className="h-4 w-4" />
              Armar mi plan
            </Button>
          </Link>
        </div>
      </PlasticPanel>
    );
  }

  return (
    <PlasticPanel relieve="neutro" className="overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-zinc-950">Lo que sigue</h2>
        <Link href="/dashboard/publicaciones" className="text-xs font-medium text-accent hover:underline">
          Ver todo
        </Link>
      </div>

      <ul className="flex flex-col">
        {piezas.map((pieza) => {
          const fecha = new Date(`${pieza.scheduled_date}T00:00:00Z`);
          const Icono = pieza.content_kind === "video" ? Clapperboard : ImageIcon;
          const siguiente = QUE_SIGUE[pieza.status];
          return (
            <li key={pieza.id}>
              <Link
                href="/dashboard/publicaciones"
                className="flex items-center gap-3.5 px-5 py-3 transition-colors hover:bg-zinc-900/[0.025] sm:px-6"
              >
                {/* La ficha del día, levantada: la única pieza de plástico
                    dentro del panel, porque es el dato que se busca al
                    barrer la lista con la vista. */}
                <span
                  className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl"
                  style={{
                    background: "linear-gradient(180deg,#ffffff 0%,#f1f3f6 100%)",
                    boxShadow: [
                      "inset 0 1px 1px rgba(255,255,255,0.95)",
                      "inset 0 -2px 4px rgba(15,23,42,0.07)",
                      "inset 0 0 0 1px rgba(15,23,42,0.05)",
                      "0 4px 8px -4px rgba(15,23,42,0.22)",
                    ].join(","),
                  }}
                >
                  <span className="text-[9px] font-semibold uppercase leading-none tracking-wide text-zinc-400">
                    {DIA_CORTO.format(fecha).replace(".", "")}
                  </span>
                  <span className="font-mono text-[15px] font-semibold leading-tight tabular-nums text-zinc-900">
                    {NUM_DIA.format(fecha)}
                  </span>
                </span>

                {/* En celular la pastilla de estado baja al renglón de
                    abajo en vez de pelear por el ancho con el título: en
                    línea, "Reto de 21 días arranca el lunes" se cortaba en
                    "Reto de 21 días a…" y el tema es lo único que
                    identifica la pieza. */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900">{pieza.topic}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-zinc-500">
                    <Icono className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="truncate">
                      {FORMAT_LABELS[pieza.format]}
                      {pieza.recommended_publish_time ? ` · ${pieza.recommended_publish_time.slice(0, 5)}` : ""}
                    </span>
                    <span className="sm:hidden">
                      <PressedChip tono={siguiente.tono}>{siguiente.texto}</PressedChip>
                    </span>
                  </div>
                </div>

                <span className="hidden sm:inline-flex">
                  <PressedChip tono={siguiente.tono}>{siguiente.texto}</PressedChip>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="h-3" />
    </PlasticPanel>
  );
}
