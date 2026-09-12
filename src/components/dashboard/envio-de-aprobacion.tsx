"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff, Link2, MessageSquare, type LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { crearLigaDeAprobacion } from "@/app/dashboard/publicaciones/aprobacion-actions";
import { mesEnPalabras } from "@/lib/aprobacion/liga";
import { Button } from "@/components/ui/button";
import { PlasticPanel } from "@/components/dashboard/plastic-panel";

/**
 * El panel para mandarle el mes al cliente y ver qué contestó.
 *
 * Existe porque el cliente de la agencia no tiene cuenta: la aprobación
 * del panel (el botón "Aprobar" de Publicaciones) sirve cuando el dueño
 * del negocio es el usuario, y aquí el usuario es quien produce. Sin una
 * liga que se abra sin sesión, cada mes se aprueba por chat, pieza por
 * pieza, sin registro de qué se dijo.
 *
 * Lo que se enseña arriba no es la liga: es si el cliente la abrió. Ese
 * dato convierte "no me ha contestado" en dos problemas distintos —no la
 * vio, o la vio y no quiso decir nada— y cada uno se atiende diferente.
 */

export type ResumenDeLiga = {
  token: string;
  desde: string;
  abierta: boolean;
  cerrada: boolean;
  total: number;
  aprobadas: number;
  conCambios: number;
  cambiosPedidos: { titulo: string; comentario: string }[];
};

/** La URL se arma con el origen del navegador y no con un dominio
 *  escrito en el código: así la liga que se copia desde un despliegue de
 *  vista previa apunta a esa vista previa, y la de producción a
 *  producción. Un dominio fijo se copia bien y lleva a la nada. */
function ligaCompleta(token: string): string {
  return `${window.location.origin}/aprobar/${token}`;
}

function Encabezado({
  Icono,
  titulo,
  descripcion,
}: {
  Icono: LucideIcon;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-accent"
        style={{
          background: "linear-gradient(180deg,#f7fafd 0%,#e8eff6 100%)",
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9), inset 0 -2px 4px rgba(31,62,92,0.10)",
        }}
      >
        <Icono className="h-5 w-5" strokeWidth={2} />
      </span>
      <div>
        <p className="text-[15px] font-semibold tracking-tight text-zinc-950">{titulo}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-zinc-600">{descripcion}</p>
      </div>
    </div>
  );
}

function Marcador({ valor, texto }: { valor: number; texto: string }) {
  return (
    <div className="rounded-xl bg-zinc-100 px-3 py-2 shadow-[var(--relieve-hundido)]">
      <p className="text-lg font-semibold tracking-tight text-zinc-950">{valor}</p>
      <p className="text-[11px] leading-tight text-zinc-500">{texto}</p>
    </div>
  );
}

export function EnvioDeAprobacion({ resumen }: { resumen: ResumenDeLiga | null }) {
  const [creando, setCreando] = useState(false);
  const [copiada, setCopiada] = useState(false);

  async function crear() {
    setCreando(true);
    const res = await crearLigaDeAprobacion();
    setCreando(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    await copiar(res.data.token);
    toast.success("Liga creada y copiada. Mándasela por WhatsApp.");
  }

  async function copiar(token: string) {
    try {
      await navigator.clipboard.writeText(ligaCompleta(token));
      setCopiada(true);
      setTimeout(() => setCopiada(false), 2500);
    } catch {
      // Safari niega el portapapeles si el gesto del usuario ya se
      // "gastó" en el await de la server action. Enseñarla es mejor que
      // fallar en silencio: se puede seleccionar a mano.
      toast.message("Copia la liga a mano", { description: ligaCompleta(token) });
    }
  }

  if (!resumen) {
    return (
      <PlasticPanel relieve="neutro" className="mb-6 p-5 sm:p-6">
        <Encabezado
          Icono={Link2}
          titulo="Mandar el mes a aprobar"
          descripcion="Una liga que tu cliente abre sin cuenta, ve cada pieza y te dice si va o qué le cambias."
        />
        <Button onClick={() => void crear()} loading={creando} size="sm" className="mt-4">
          Crear la liga del mes
        </Button>
      </PlasticPanel>
    );
  }

  const sinContestar = resumen.total - resumen.aprobadas - resumen.conCambios;

  return (
    <PlasticPanel
      relieve={resumen.cerrada ? "listo" : resumen.abierta ? "neutro" : "pendiente"}
      className="mb-6 p-5 sm:p-6"
    >
      <Encabezado
        Icono={resumen.abierta ? Eye : EyeOff}
        titulo={`Aprobación de ${mesEnPalabras(resumen.desde)}`}
        descripcion={
          resumen.cerrada
            ? "Tu cliente terminó de revisar el mes."
            : resumen.abierta
              ? "Tu cliente ya abrió la liga."
              : "Tu cliente todavía no abre la liga."
        }
      />

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Marcador valor={resumen.aprobadas} texto="aprobadas" />
        <Marcador valor={resumen.conCambios} texto="con cambios" />
        <Marcador valor={sinContestar} texto="sin contestar" />
      </div>

      {/* Los cambios pedidos, con su texto. Es lo único de este panel que
          se convierte en trabajo, así que se lee aquí en vez de obligar a
          abrir la liga del cliente para enterarse. */}
      {resumen.cambiosPedidos.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {resumen.cambiosPedidos.map((cambio) => (
            <li
              key={`${cambio.titulo}-${cambio.comentario.slice(0, 12)}`}
              className="rounded-xl bg-amber-50 px-3 py-2"
            >
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-amber-900">
                <MessageSquare className="h-3.5 w-3.5" strokeWidth={2} />
                {cambio.titulo}
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-amber-800">{cambio.comentario}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => void copiar(resumen.token)}>
          {copiada ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copiada ? "Copiada" : "Copiar la liga"}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void crear()} loading={creando}>
          Crear una nueva
        </Button>
      </div>
    </PlasticPanel>
  );
}
