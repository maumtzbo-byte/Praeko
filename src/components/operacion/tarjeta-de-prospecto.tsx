"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, MessageCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { anotarProspecto, moverProspecto } from "@/app/prospectos/actions";
import {
  ESTADOS,
  ETIQUETA_DE_ESTADO,
  TONO_DE_ESTADO,
  type Estado,
} from "@/lib/operacion/prospectos";
import { cn } from "@/lib/utils";

export type Prospecto = {
  id: string;
  nombre: string;
  negocio: string;
  giro: string;
  whatsapp: string;
  ligaWhatsapp: string | null;
  instagram: string | null;
  sitioWeb: string | null;
  ciudad: string | null;
  vende: string | null;
  preguntan: string | null;
  estilos: string[];
  fotos: string[];
  estado: Estado;
  notas: string | null;
  origen: string | null;
  cuando: string;
  dias: number;
};

/** Un dato del prospecto. Los que no llegaron no se pintan: una lista de
 *  seis renglones donde cuatro dicen "—" tarda más en leerse que tres que
 *  dicen algo, y además esconde lo que sí hay. */
function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        {etiqueta}
      </dt>
      <dd className="mt-0.5 text-sm text-zinc-800">{children}</dd>
    </div>
  );
}

export function TarjetaDeProspecto({ prospecto }: { prospecto: Prospecto }) {
  // El estado se lleva localmente y se siembra de las props. Es el valor
  // que se acaba de escribir en la base, así que siempre es igual o más
  // nuevo que el que viene del servidor.
  const [estado, setEstado] = useState<Estado>(prospecto.estado);
  const [notas, setNotas] = useState(prospecto.notas ?? "");
  // Lo último que se guardó de verdad. Se lleva aparte de las props porque
  // el botón tiene que apagarse en el momento en que la nota se guarda, y
  // las props no se actualizan hasta que llega el refresco del servidor.
  const [guardadas, setGuardadas] = useState(prospecto.notas ?? "");
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moviendo, empezarMovimiento] = useTransition();
  const [guardando, empezarGuardado] = useTransition();

  const notasSucias = notas.trim() !== guardadas.trim();

  function mover(nuevo: Estado) {
    if (nuevo === estado) return;
    setError(null);
    const anterior = estado;
    setEstado(nuevo);
    empezarMovimiento(async () => {
      const r = await moverProspecto({ id: prospecto.id, estado: nuevo });
      // Se revierte si falló. Sin esto, la pantalla enseñaría "Cliente"
      // sobre una fila que en la base sigue diciendo "Nuevo", que es peor
      // que no haber movido nada.
      if (!r.success) {
        setEstado(anterior);
        setError(r.error);
      }
    });
  }

  function guardarNotas() {
    setError(null);
    setGuardado(false);
    empezarGuardado(async () => {
      const r = await anotarProspecto({ id: prospecto.id, notas });
      if (r.success) {
        setGuardadas(notas);
        setGuardado(true);
      } else {
        setError(r.error);
      }
    });
  }

  const contexto =
    prospecto.vende ||
    prospecto.preguntan ||
    prospecto.ciudad ||
    prospecto.estilos.length > 0 ||
    prospecto.fotos.length > 0;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-[var(--relieve-pieza)] sm:p-6">
      {/* Sin `flex-wrap`: con él, el nombre largo de una marca empujaba la
          etiqueta de estado al renglón de abajo y alineada a la izquierda,
          mientras que en la tarjeta de al lado seguía arriba a la derecha.
          Dos tarjetas idénticas con la etiqueta en lugares distintos
          obligan a buscarla en cada una. */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-zinc-900">{prospecto.negocio}</h2>
          <p className="mt-0.5 text-sm text-zinc-600">
            {prospecto.nombre} · {prospecto.giro}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant={TONO_DE_ESTADO[estado]}>{ETIQUETA_DE_ESTADO[estado]}</Badge>
          <span className="text-xs text-zinc-400">
            {prospecto.dias === 0
              ? "Hoy"
              : prospecto.dias === 1
                ? "Ayer"
                : `Hace ${prospecto.dias} días`}
          </span>
        </div>
      </header>

      {/* Contacto arriba y en botón, no en una lista de datos: es lo único
          de esta tarjeta que hay que hacer, y todo lo demás es para
          decidir qué escribir. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {prospecto.ligaWhatsapp ? (
          <a href={prospecto.ligaWhatsapp} target="_blank" rel="noopener noreferrer">
            <Button size="sm">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
          </a>
        ) : (
          <span className="text-sm text-zinc-500">
            WhatsApp inválido: {prospecto.whatsapp}
          </span>
        )}
        {prospecto.instagram && (
          <a
            href={`https://instagram.com/${prospecto.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent underline underline-offset-2"
          >
            @{prospecto.instagram}
          </a>
        )}
        {prospecto.sitioWeb && (
          <a
            href={prospecto.sitioWeb}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-accent underline underline-offset-2"
          >
            Sitio
          </a>
        )}
      </div>

      {contexto && (
        <dl className="mt-5 grid gap-4 border-t border-zinc-100 pt-5 sm:grid-cols-2">
          {prospecto.vende && <Dato etiqueta="Qué producto">{prospecto.vende}</Dato>}
          {prospecto.preguntan && (
            <Dato etiqueta="Qué le preguntan">{prospecto.preguntan}</Dato>
          )}
          {prospecto.ciudad && <Dato etiqueta="Ciudad">{prospecto.ciudad}</Dato>}
          {prospecto.estilos.length > 0 && (
            <Dato etiqueta="Estilo que eligió">{prospecto.estilos.join(", ")}</Dato>
          )}
        </dl>
      )}

      {prospecto.fotos.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            Fotos que subió
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {prospecto.fotos.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="h-20 w-20 overflow-hidden rounded-xl bg-zinc-100 shadow-[var(--relieve-hundido)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 border-t border-zinc-100 pt-5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Mover a</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ESTADOS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => mover(opcion)}
              disabled={moviendo}
              aria-pressed={opcion === estado}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-60",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                opcion === estado
                  ? "bg-zinc-900 text-white shadow-[var(--relieve-oscuro)]"
                  : "bg-[image:var(--plastico)] text-zinc-700 shadow-[var(--relieve-pieza)] hover:brightness-[1.02] active:translate-y-px",
              )}
            >
              {ETIQUETA_DE_ESTADO[opcion]}
            </button>
          ))}
          {moviendo && <Loader2 className="mt-1.5 h-4 w-4 animate-spin text-zinc-400" />}
        </div>
      </div>

      <div className="mt-5">
        <label
          htmlFor={`notas-${prospecto.id}`}
          className="text-[11px] font-medium uppercase tracking-wide text-zinc-400"
        >
          Notas
        </label>
        <Textarea
          id={`notas-${prospecto.id}`}
          value={notas}
          onChange={(e) => {
            setNotas(e.target.value);
            setGuardado(false);
          }}
          placeholder="Qué se le dijo, qué quedó pendiente, cuánto cotizó."
          className="mt-2 min-h-[72px]"
          maxLength={2000}
        />
        <div className="mt-2 flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={guardarNotas}
            disabled={!notasSucias || guardando}
            loading={guardando}
          >
            Guardar nota
          </Button>
          {guardado && (
            <span className="flex items-center gap-1 text-xs text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              Guardada
            </span>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-zinc-400">
        {prospecto.cuando}
        {prospecto.origen ? ` · origen: ${prospecto.origen}` : ""}
      </p>

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </article>
  );
}
