"use client";

import { useState, useTransition } from "react";
import { MessageSquareText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { importarHilo, type Importacion } from "@/app/prospectos/actions";

export type HiloSinProspecto = {
  telefono: string;
  nombrePerfil: string | null;
  cuantos: number;
  ultimo: string;
  /** El último mensaje suyo, recortado. Es lo que deja decidir si vale la
   *  pena sin abrir nada. */
  vistazo: string;
};

/**
 * Conversaciones que llegaron por WhatsApp y todavía no son un prospecto.
 *
 * El webhook guarda todo lo que entra, pero guardar no es lo mismo que
 * atender. Esta es la bandeja: lo que escribió gente que no existe en el
 * embudo. Un botón lo convierte en prospecto —el mismo agente, sobre el
 * hilo completo— y desaparece de aquí.
 */
export function ConversacionesSinProspecto({ hilos }: { hilos: HiloSinProspecto[] }) {
  if (hilos.length === 0) return null;

  return (
    <section className="rounded-2xl bg-white p-5 shadow-[var(--relieve-pieza)] sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-900">
        <MessageSquareText className="h-4 w-4 text-accent" strokeWidth={1.75} />
        Te escribieron y no están en la lista
        <span className="text-sm font-normal text-zinc-500">({hilos.length})</span>
      </h2>
      <div className="mt-4 space-y-3">
        {hilos.map((hilo) => (
          <Hilo key={hilo.telefono} hilo={hilo} />
        ))}
      </div>
    </section>
  );
}

function Hilo({ hilo }: { hilo: HiloSinProspecto }) {
  const [resultado, setResultado] = useState<Importacion | null>(null);
  const [trabajando, empezar] = useTransition();

  function crear() {
    setResultado(null);
    empezar(async () => {
      setResultado(await importarHilo({ telefono: hilo.telefono }));
    });
  }

  // Cuando funciona, la fila desaparece de la lista en cuanto el servidor
  // refresque. Mientras tanto se deja el aviso para que no parezca que el
  // botón no hizo nada.
  if (resultado?.success) {
    return (
      <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-[var(--relieve-hundido)]">
        Registrado: {resultado.negocio}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-zinc-50 px-4 py-3 shadow-[var(--relieve-hundido)]">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-900">
          {hilo.nombrePerfil ?? hilo.telefono}
          <span className="ml-2 text-xs font-normal text-zinc-500">
            {hilo.cuantos} {hilo.cuantos === 1 ? "mensaje" : "mensajes"} · {hilo.ultimo}
          </span>
        </p>
        <p className="mt-0.5 truncate text-sm text-zinc-600">{hilo.vistazo}</p>
        {resultado && !resultado.success && (
          <p className="mt-1 text-sm text-red-700">{resultado.error}</p>
        )}
      </div>
      <Button size="sm" variant="secondary" onClick={crear} loading={trabajando}>
        Crear prospecto
      </Button>
    </div>
  );
}
