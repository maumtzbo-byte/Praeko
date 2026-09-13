"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Check, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { moverAgregadoDeComentarios } from "@/app/prospectos/muestra-actions";
import type { NivelDeRiesgo, Riesgo } from "@/lib/operacion/riesgo";
import { cn } from "@/lib/utils";
import { MetasDelCliente, type MetaDelCliente } from "./metas-del-cliente";

export type ClienteEnLista = {
  id: string;
  nombre: string;
  giro: string | null;
  telefono: string | null;
  plan: string | null;
  estadoSuscripcion: string | null;
  agregadoComentarios: boolean;
  precioAgregado: number | null;
  diasDeCliente: number;
  publicadasUltimoMes: number;
  piezasMedidas: number;
  riesgo: Riesgo;
  metas: MetaDelCliente[];
};

const TONO: Record<NivelDeRiesgo, "success" | "warning" | "danger"> = {
  bien: "success",
  ojo: "warning",
  urgente: "danger",
};

const ETIQUETA: Record<NivelDeRiesgo, string> = {
  bien: "Va bien",
  ojo: "Ojo",
  urgente: "Urgente",
};

export function ListaDeClientes({ clientes }: { clientes: ClienteEnLista[] }) {
  if (clientes.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-[var(--relieve-pieza)]">
        <p className="text-sm text-zinc-600">
          Todavía no hay clientes. Aquí van a aparecer con su nivel de riesgo en cuanto
          contrate el primero.
        </p>
      </div>
    );
  }

  const urgentes = clientes.filter((c) => c.riesgo.nivel === "urgente").length;

  return (
    <div className="space-y-4">
      {urgentes > 0 && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900 shadow-[var(--relieve-hundido)]">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          {urgentes === 1
            ? "1 cliente necesita que le hables hoy."
            : `${urgentes} clientes necesitan que les hables hoy.`}
        </p>
      )}
      {clientes.map((cliente) => (
        <TarjetaDeCliente key={cliente.id} cliente={cliente} />
      ))}
    </div>
  );
}

function TarjetaDeCliente({ cliente }: { cliente: ClienteEnLista }) {
  const [activo, setActivo] = useState(cliente.agregadoComentarios);
  const [precio, setPrecio] = useState(String(cliente.precioAgregado ?? 900));
  const [error, setError] = useState<string | null>(null);
  const [guardando, empezar] = useTransition();

  function alternar() {
    const nuevo = !activo;
    setActivo(nuevo);
    setError(null);
    empezar(async () => {
      const r = await moverAgregadoDeComentarios({
        businessId: cliente.id,
        activo: nuevo,
        precio: Number(precio),
      });
      if (!r.success) {
        setActivo(!nuevo);
        setError(r.error);
      }
    });
  }

  return (
    <article
      className={cn(
        "rounded-2xl bg-white p-5 shadow-[var(--relieve-pieza)] sm:p-6",
        cliente.riesgo.nivel === "urgente" && "ring-1 ring-red-200",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-zinc-900">{cliente.nombre}</h2>
          <p className="mt-0.5 text-sm text-zinc-600">
            {[cliente.giro, cliente.plan && `Plan ${cliente.plan}`, `${cliente.diasDeCliente} días de cliente`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <Badge variant={TONO[cliente.riesgo.nivel]}>{ETIQUETA[cliente.riesgo.nivel]}</Badge>
      </header>

      {cliente.riesgo.senales.length > 0 && (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <ul className="space-y-1 text-sm text-zinc-700">
            {cliente.riesgo.senales.map((senal) => (
              <li key={senal.texto} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-400" />
                {senal.texto}
              </li>
            ))}
          </ul>
          {cliente.riesgo.quehacer && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-900 shadow-[var(--relieve-hundido)]">
              {cliente.riesgo.quehacer}
            </p>
          )}
        </div>
      )}

      <dl className="mt-4 grid gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-3">
        <Dato etiqueta="Publicadas (30 días)">{cliente.publicadasUltimoMes}</Dato>
        <Dato etiqueta="Piezas medidas">{cliente.piezasMedidas}</Dato>
        <Dato etiqueta="Suscripción">{cliente.estadoSuscripcion ?? "sin plan"}</Dato>
      </dl>

      {/* El agregado: es la venta que más retiene y la que se olvida. Va en
          la tarjeta y no en otra pantalla para que se vea junto al motivo
          por el que conviene hacerla. */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
        <MessageCircle className="h-4 w-4 text-accent" strokeWidth={1.75} />
        <span className="text-sm text-zinc-700">Agregado de comentarios</span>
        {activo ? (
          <span className="flex items-center gap-1 text-sm text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            Activo
            {cliente.precioAgregado ? ` · $${cliente.precioAgregado.toLocaleString("es-MX")}/mes` : ""}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">$</span>
            <Input
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              inputMode="numeric"
              aria-label={`Precio del agregado para ${cliente.nombre}`}
              className="h-9 w-24"
            />
          </div>
        )}
        <Button size="sm" variant={activo ? "ghost" : "secondary"} onClick={alternar} loading={guardando}>
          {activo ? "Quitar" : "Activar"}
        </Button>
        {error && <span className="text-sm text-red-700">{error}</span>}
      </div>

      {!activo && (
        <p className="mt-2 text-xs text-zinc-500">
          Mientras esté apagado, sus comentarios se guardan pero nadie los contesta solo.
        </p>
      )}

      <MetasDelCliente businessId={cliente.id} metas={cliente.metas} />
    </article>
  );
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{etiqueta}</dt>
      <dd className="mt-0.5 text-sm text-zinc-800">{children}</dd>
    </div>
  );
}
