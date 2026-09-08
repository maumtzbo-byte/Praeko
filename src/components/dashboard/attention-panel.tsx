import Link from "next/link";
import { ChevronRight, Check } from "lucide-react";

import { PlasticPanel, PressedChip } from "@/components/dashboard/plastic-panel";
import type { AttentionItem } from "@/components/dashboard/notification-bell";

/**
 * "¿Tengo que hacer algo?" — la primera pregunta que trae al dueño a
 * abrir Frames, contestada en la pantalla y no dentro de un icono.
 *
 * Esta lista se calcula desde siempre (ver getAttentionItems en
 * dashboard/page.tsx): contenido esperando aprobación, generaciones
 * fallidas, comentarios sin responder, conexiones caídas, fechas
 * comerciales y el fin del mes gratis. Vivía solo detrás de la campana de
 * la esquina, mientras ocho tarjetas de analíticas —varias con un guion en
 * vez de un número— se llevaban la pantalla. La campana se queda como
 * respaldo; lo urgente ya no vive únicamente ahí.
 *
 * El orden es por urgencia y no por fecha: lo que está roto primero, luego
 * lo que espera al dueño, al final lo que solo avisa. Una lista de
 * pendientes ordenada cronológicamente obliga a leerla completa para
 * encontrar lo grave.
 */
const PESO: Record<AttentionItem["tono"], number> = { roto: 0, pendiente: 1, neutro: 2 };

const ETIQUETA: Record<AttentionItem["tono"], string> = {
  roto: "Se rompió",
  pendiente: "Te toca",
  neutro: "Aviso",
};

export function AttentionPanel({ items }: { items: AttentionItem[] }) {
  const ordenados = [...items].sort((a, b) => PESO[a.tono] - PESO[b.tono]);
  const visibles = ordenados.slice(0, 4);
  const resto = ordenados.length - visibles.length;

  // Vacío de celebración: el único caso donde no tener nada es la buena
  // noticia. Va con su propio relieve (verde) y sin botón, porque no hay
  // nada que hacer — mandar a alguien a "explorar" aquí sería inventarle
  // trabajo justo cuando el producto acaba de cumplir su promesa.
  if (ordenados.length === 0) {
    return (
      <PlasticPanel relieve="listo" className="p-5 sm:p-6">
        <div className="flex items-center gap-3.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[#0a6b4a]"
            style={{
              background: "linear-gradient(180deg,#f1faf6 0%,#e2f2eb 100%)",
              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(10,107,74,0.10)",
            }}
          >
            <Check className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-zinc-950">Todo al día</p>
            <p className="mt-0.5 text-sm text-zinc-500">No tienes nada pendiente. Tus agentes siguen trabajando.</p>
          </div>
        </div>
      </PlasticPanel>
    );
  }

  const peor = ordenados[0].tono;

  return (
    <PlasticPanel relieve={peor === "roto" ? "roto" : "pendiente"} className="overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-zinc-950">Necesitan que le entres</h2>
        <span className="font-mono text-xs tabular-nums text-zinc-400">{ordenados.length}</span>
      </div>

      <ul className="flex flex-col">
        {visibles.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-zinc-900/[0.025] sm:px-6"
            >
              {/* El icono va hundido, la pieza completa va levantada: el
                  relieve dice qué se puede tocar. */}
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-zinc-500"
                style={{
                  background: "linear-gradient(180deg,#f6f7f9 0%,#eceff3 100%)",
                  boxShadow: "inset 0 1px 2px rgba(15,23,42,0.09), inset 0 -1px 0 rgba(255,255,255,0.9)",
                }}
              >
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-zinc-900">{item.label}</p>
                  <PressedChip tono={item.tono}>{ETIQUETA[item.tono]}</PressedChip>
                </div>
                {/* Dos renglones y no `truncate`: en 390 px de ancho el
                    corte a un renglón se comía la mitad del dato —
                    «"Antes y después: Ana, 12 semanas" no se p…»— que es
                    justo lo que distingue un pendiente de otro. */}
                <p className="line-clamp-2 text-xs leading-snug text-zinc-500">{item.detail}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
            </Link>
          </li>
        ))}
      </ul>

      {resto > 0 && (
        <p className="px-5 pb-4 pt-1 text-xs text-zinc-400 sm:px-6">
          y {resto} {resto === 1 ? "pendiente más" : "pendientes más"} en la campana
        </p>
      )}
      {resto === 0 && <div className="h-2" />}
    </PlasticPanel>
  );
}
