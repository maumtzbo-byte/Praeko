import { MessageCircle } from "lucide-react";

/** Una salida ya contada, como la deja `resumirSalidas`. */
export type ResumenDeSalidas = {
  hoy: number;
  semana: number;
  /** Los orígenes de los últimos 7 días, de mayor a menor. */
  porOrigen: { origen: string; cuantos: number }[];
};

/**
 * Cuántos se fueron por el botón de WhatsApp sin llenar el formulario.
 *
 * Es el número que le falta al embudo: un anuncio puede traer cero
 * registros y quince conversaciones, y sin esto se leería como un anuncio
 * fallido. Va arriba de la lista y en una sola línea — es contexto para
 * leer los prospectos de abajo, no una pantalla de reportes.
 */
export function SalidasAWhatsapp({ resumen }: { resumen: ResumenDeSalidas }) {
  if (resumen.semana === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white px-5 py-3.5 shadow-[var(--relieve-pieza)]">
      <span className="flex items-center gap-2 text-sm text-zinc-700">
        <MessageCircle className="h-4 w-4 text-accent" strokeWidth={1.75} />
        Se fueron al WhatsApp sin registrarse
      </span>
      <span className="text-sm text-zinc-900">
        <strong className="font-semibold">{resumen.hoy}</strong> hoy
        <span className="mx-2 text-zinc-300">·</span>
        <strong className="font-semibold">{resumen.semana}</strong> en 7 días
      </span>
      {resumen.porOrigen.length > 0 && (
        <span className="text-xs text-zinc-500">
          {resumen.porOrigen.map((o) => `${o.origen} (${o.cuantos})`).join(" · ")}
        </span>
      )}
    </div>
  );
}
