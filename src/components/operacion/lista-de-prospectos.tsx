"use client";

import { useMemo, useState } from "react";

import { TarjetaDeProspecto, type Prospecto } from "./tarjeta-de-prospecto";
import { ESTADOS, ETIQUETA_DE_ESTADO, type Estado } from "@/lib/operacion/prospectos";
import { cn } from "@/lib/utils";

export type { Prospecto };

type Filtro = Estado | "todos";

export function ListaDeProspectos({ prospectos }: { prospectos: Prospecto[] }) {
  const [filtro, setFiltro] = useState<Filtro>("todos");

  // El conteo se saca de las props, o sea del estado que trae el servidor.
  // Si una tarjeta se acaba de mover, su contador queda un segundo atrás
  // hasta que llega el refresco — y eso es preferible a espejear el estado
  // de cinco tarjetas aquí arriba para que un número cuadre antes.
  const conteos = useMemo(() => {
    const mapa = new Map<Estado, number>();
    for (const p of prospectos) mapa.set(p.estado, (mapa.get(p.estado) ?? 0) + 1);
    return mapa;
  }, [prospectos]);

  const visibles =
    filtro === "todos" ? prospectos : prospectos.filter((p) => p.estado === filtro);

  if (prospectos.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-[var(--relieve-pieza)]">
        <p className="text-sm text-zinc-600">
          Todavía no llega nadie. Aquí va a aparecer cada marca que llene el formulario de{" "}
          <span className="font-medium text-zinc-900">/prueba</span>, con sus fotos y el estilo
          que eligió.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        <Pestaña activa={filtro === "todos"} onClick={() => setFiltro("todos")}>
          Todos <Cuenta>{prospectos.length}</Cuenta>
        </Pestaña>
        {ESTADOS.map((estado) => {
          const n = conteos.get(estado) ?? 0;
          // Un estado sin nadie adentro no necesita pestaña: llevaría a una
          // lista vacía y ocupa el lugar de los que sí tienen.
          if (n === 0) return null;
          return (
            <Pestaña
              key={estado}
              activa={filtro === estado}
              onClick={() => setFiltro(estado)}
            >
              {ETIQUETA_DE_ESTADO[estado]} <Cuenta>{n}</Cuenta>
            </Pestaña>
          );
        })}
      </div>

      <div className="mt-5 space-y-4">
        {visibles.map((prospecto) => (
          <TarjetaDeProspecto key={prospecto.id} prospecto={prospecto} />
        ))}
        {visibles.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            Nadie en {ETIQUETA_DE_ESTADO[filtro as Estado].toLowerCase()} por ahora.
          </p>
        )}
      </div>
    </div>
  );
}

function Pestaña({
  activa,
  onClick,
  children,
}: {
  activa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium transition-all",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        activa
          ? "bg-zinc-900 text-white shadow-[var(--relieve-oscuro)]"
          : "bg-[image:var(--plastico)] text-zinc-700 shadow-[var(--relieve-pieza)] hover:brightness-[1.02] active:translate-y-px",
      )}
    >
      {children}
    </button>
  );
}

function Cuenta({ children }: { children: React.ReactNode }) {
  return <span className="opacity-60">{children}</span>;
}
