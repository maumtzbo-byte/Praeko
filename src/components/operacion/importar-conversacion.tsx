"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { importarConversacion, type Importacion } from "@/app/prospectos/actions";

/**
 * Pegar una conversación de WhatsApp y que salga el prospecto.
 *
 * Va cerrado por omisión. La pantalla es para ver los prospectos; esto es
 * lo que se hace de vez en cuando, y un formulario grande permanentemente
 * abierto arriba empuja hacia abajo lo que sí se viene a ver.
 */
export function ImportarConversacion() {
  const [abierto, setAbierto] = useState(false);
  const [conversacion, setConversacion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [resultado, setResultado] = useState<Importacion | null>(null);
  const [trabajando, empezar] = useTransition();

  function importar() {
    setResultado(null);
    empezar(async () => {
      const r = await importarConversacion({ conversacion, whatsapp: telefono });
      setResultado(r);
      // Se limpia solo si funcionó. Si falló, el texto pegado sigue ahí:
      // volver a copiarlo de WhatsApp por un error nuestro es la clase de
      // cosa que hace que una herramienta se deje de usar.
      if (r.success) {
        setConversacion("");
        setTelefono("");
      }
    });
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-medium text-zinc-700 shadow-[var(--relieve-pieza)] transition-all hover:brightness-[1.02] active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Sparkles className="h-4 w-4 text-accent" strokeWidth={1.75} />
        Pegar una conversación de WhatsApp
        <ChevronDown className="h-4 w-4 text-zinc-400" />
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[var(--relieve-pieza)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Pegar una conversación de WhatsApp
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Saca los datos del prospecto y lo registra. Si el número ya existe, le suma lo
            nuevo en vez de duplicarlo.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setAbierto(false)}>
          Cerrar
        </Button>
      </div>

      <Textarea
        value={conversacion}
        onChange={(e) => setConversacion(e.target.value)}
        placeholder="Pega aquí los mensajes tal como están en WhatsApp."
        className="mt-4 min-h-[160px]"
      />

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1">
          <label htmlFor="telefono-importar" className="text-sm text-zinc-700">
            Su WhatsApp
          </label>
          <Input
            id="telefono-importar"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="81 4007 6185"
            inputMode="tel"
            className="mt-1.5"
          />
          {/* El número de quien escribe no viene en el cuerpo del mensaje,
              así que casi siempre hay que ponerlo. Decirlo aquí evita que
              alguien importe tres veces antes de entender por qué falla. */}
          <p className="mt-1.5 text-xs text-zinc-500">
            Cópialo del contacto: casi nunca viene escrito dentro del chat.
          </p>
        </div>
        <Button onClick={importar} loading={trabajando} disabled={conversacion.trim().length < 20}>
          Importar
        </Button>
      </div>

      {resultado && !resultado.success && (
        <p className="mt-4 text-sm text-red-700">{resultado.error}</p>
      )}

      {resultado?.success && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 shadow-[var(--relieve-hundido)]">
          <p className="text-sm font-medium text-emerald-900">
            {resultado.creado
              ? `Registrado: ${resultado.negocio}`
              : `Ya existía ${resultado.negocio} — le sumé lo nuevo`}
          </p>
          <p className="mt-1 text-sm text-emerald-800">{resultado.resumen}</p>
          {resultado.faltantes.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Falta preguntarle
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-emerald-800">
                {resultado.faltantes.map((falta) => (
                  <li key={falta}>{falta}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
