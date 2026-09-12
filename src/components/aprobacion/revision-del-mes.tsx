"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, MessageSquare } from "lucide-react";

import { cerrarRevision, marcarAbierta, responderPieza } from "@/app/aprobar/[token]/actions";
import { diaCorto } from "@/lib/aprobacion/liga";
import { primerCuadro } from "@/lib/content/media";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FramesMark } from "@/components/brand/FramesMark";

/**
 * La revisión del mes, pieza por pieza.
 *
 * Se diseñó para el teléfono primero y no por costumbre: esta liga llega
 * por WhatsApp, y quien la abre lo hace con el pulgar, de pie, entre dos
 * cosas. De ahí salen tres decisiones:
 *
 *   · El estado vive aquí, en el cliente, y cada pieza se guarda sola. Si
 *     fuera un formulario que se manda al final, doce piezas serían una
 *     sola oportunidad de perderlo todo al cambiar de app.
 *   · El avance se ve siempre (la barra de arriba se queda pegada). Una
 *     lista larga sin cuenta visible se abandona a la mitad.
 *   · "Pedir cambio" obliga a escribir qué. Un "no me gusta" sin más
 *     regresa la pieza a producción y quien la rehace no sabe qué mover,
 *     así que se pregunta aquí y no en una segunda vuelta por chat.
 */

export type PiezaParaRevisar = {
  id: string;
  fecha: string;
  tipo: "imagen" | "video";
  formato: string;
  titulo: string;
  guion: string | null;
  veredicto: "aprobado" | "cambios" | null;
  comentario: string | null;
  medio: string | null;
};

/** Le pone techo a una espera.
 *
 *  Le piqué al botón con la base de datos inalcanzable esperando ver un
 *  error, y lo que vi fue un botón girando a los seis segundos, y a los
 *  veinte, sin decir nada. La acción no falla: se cuelga. supabase-js no
 *  trae tiempo límite en su fetch, así que una base lenta o inalcanzable
 *  deja la promesa pendiente para siempre y con ella el `guardando`.
 *
 *  Un try/catch no alcanza para eso —no hay nada que atrapar—, así que la
 *  espera se corta aquí. 20 segundos porque tiene que aguantar un teléfono
 *  con mala señal sin cortarle a alguien que sí iba a recibir respuesta.
 *
 *  El mensaje al vencerse dice que PUEDE no haberse guardado, y no que
 *  falló: el servidor pudo haber escrito y perdido la respuesta de
 *  regreso. Prometer que no se guardó sería adivinar. Y da igual para el
 *  que lo lee, porque volver a mandar el mismo veredicto deja la pieza
 *  exactamente igual. */
const LIMITE_MS = 20_000;

class SeVencio extends Error {}

function conLimite<T>(promesa: Promise<T>): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<never>((_, rechazar) =>
      setTimeout(() => rechazar(new SeVencio()), LIMITE_MS),
    ),
  ]);
}

const FORMATOS: Record<string, string> = {
  reel: "Reel",
  carrusel: "Carrusel",
  imagen_unica: "Imagen",
  promocion: "Promoción",
};

type EstadoPieza = {
  veredicto: "aprobado" | "cambios" | null;
  comentario: string | null;
  guardando: boolean;
  error: string | null;
  pidiendoCambio: boolean;
};

function Medio({ pieza }: { pieza: PiezaParaRevisar }) {
  if (!pieza.medio) {
    // Sin archivo todavía: se dice, no se disimula con un recuadro de
    // color. El cliente tiene que poder distinguir "no está lista" de
    // "está lista y así quedó".
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-zinc-100 px-6 text-center shadow-[var(--relieve-hundido)]">
        <p className="text-[13px] leading-snug text-zinc-500">
          Todavía en producción. Te avisamos cuando esta pieza esté lista.
        </p>
      </div>
    );
  }

  if (pieza.tipo === "video") {
    return (
      <video
        src={primerCuadro(pieza.medio)}
        controls
        playsInline
        preload="metadata"
        className="aspect-[4/5] w-full rounded-2xl bg-zinc-900 object-cover"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={pieza.medio}
      alt={pieza.titulo}
      className="aspect-[4/5] w-full rounded-2xl bg-zinc-100 object-cover"
    />
  );
}

function Tarjeta({
  pieza,
  estado,
  onAprobar,
  onPedirCambio,
  onMandarCambio,
  onCancelarCambio,
}: {
  pieza: PiezaParaRevisar;
  estado: EstadoPieza;
  onAprobar: () => void;
  onPedirCambio: () => void;
  onMandarCambio: (texto: string) => void;
  onCancelarCambio: () => void;
}) {
  const [texto, setTexto] = useState(estado.comentario ?? "");
  const aprobada = estado.veredicto === "aprobado";
  const conCambios = estado.veredicto === "cambios";

  return (
    <article className="rounded-3xl bg-[image:var(--plastico)] p-4 shadow-[var(--relieve-panel)] sm:p-5">
      <Medio pieza={pieza} />

      <div className="mt-4 flex items-center gap-2">
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 shadow-[var(--relieve-hundido)]">
          {diaCorto(pieza.fecha)}
        </span>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-600 shadow-[var(--relieve-hundido)]">
          {FORMATOS[pieza.formato] ?? pieza.formato}
        </span>
      </div>

      <h2 className="mt-3 text-[17px] font-semibold leading-snug tracking-tight text-zinc-950">
        {pieza.titulo}
      </h2>
      {pieza.guion && (
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-600">{pieza.guion}</p>
      )}

      {estado.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {estado.error}
        </p>
      )}

      {/* Ya contestada: se enseña el veredicto y se deja cambiar de
          opinión. Bloquearlo obligaría a escribirnos por chat para
          corregir un clic, que es exactamente el ida y vuelta que esta
          página existe para evitar. */}
      {aprobada && !estado.pidiendoCambio && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
            Aprobada
          </span>
          <button
            type="button"
            onClick={onPedirCambio}
            className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
          >
            Mejor pedir un cambio
          </button>
        </div>
      )}

      {conCambios && !estado.pidiendoCambio && (
        <div className="mt-4">
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-700">
            <MessageSquare className="h-4 w-4" strokeWidth={2} />
            Nos pediste un cambio
          </p>
          {estado.comentario && (
            <p className="mt-1.5 rounded-xl bg-zinc-100 px-3 py-2 text-sm leading-relaxed text-zinc-700 shadow-[var(--relieve-hundido)]">
              {estado.comentario}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPedirCambio}
              className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
            >
              Cambiar lo que escribí
            </button>
            <button
              type="button"
              onClick={onAprobar}
              className="text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
            >
              Así déjala, la apruebo
            </button>
          </div>
        </div>
      )}

      {estado.pidiendoCambio && (
        <div className="mt-4 flex flex-col gap-2">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="El frasco se ve muy chico, y el texto de arriba mejor que diga el precio."
            aria-label="Qué le cambiamos"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onMandarCambio(texto)}
              loading={estado.guardando}
              disabled={texto.trim().length === 0}
            >
              Mandar el cambio
            </Button>
            <Button size="sm" variant="secondary" onClick={onCancelarCambio}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {!estado.veredicto && !estado.pidiendoCambio && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" onClick={onAprobar} loading={estado.guardando} className="flex-1">
            <Check className="h-4 w-4" strokeWidth={2} />
            Aprobar
          </Button>
          <Button size="sm" variant="secondary" onClick={onPedirCambio} className="flex-1">
            Pedir un cambio
          </Button>
        </div>
      )}
    </article>
  );
}

export function RevisionDelMes({
  token,
  marca,
  mes,
  piezas,
  yaCerrada,
}: {
  token: string;
  marca: string;
  mes: string;
  piezas: PiezaParaRevisar[];
  yaCerrada: boolean;
}) {
  const [estados, setEstados] = useState<Record<string, EstadoPieza>>(() =>
    Object.fromEntries(
      piezas.map((p) => [
        p.id,
        {
          veredicto: p.veredicto,
          comentario: p.comentario,
          guardando: false,
          error: null,
          pidiendoCambio: false,
        },
      ]),
    ),
  );
  const [cerrada, setCerrada] = useState(yaCerrada);
  const [cerrando, setCerrando] = useState(false);
  const [errorAlCerrar, setErrorAlCerrar] = useState<string | null>(null);

  // Se avisa que la abrió en cuanto se pinta, sin bloquear nada. Es el
  // dato que distingue "no la vio" de "la vio y no contestó", y esas dos
  // se atienden de forma muy distinta.
  useEffect(() => {
    // Fuego y olvido, pero con el catch puesto: si falla, una promesa
    // rechazada sin atrapar se vuelve un error de consola en la primera
    // pantalla que ve el cliente, y no arregla nada.
    marcarAbierta(token).catch(() => {});
  }, [token]);

  const revisadas = useMemo(
    () => Object.values(estados).filter((e) => e.veredicto !== null).length,
    [estados],
  );
  const faltan = piezas.length - revisadas;

    /** El estado de una pieza, con respaldo.
   *
   *  `useState` solo corre su inicializador la primera vez. Si el servidor
   *  manda una pieza que no estaba cuando se montó —se agregó una al mes
   *  mientras el cliente tenía la página abierta— `estados[id]` sale
   *  `undefined` y leerle `.veredicto` tumba la página completa. Con doce
   *  piezas revisadas a medias, eso es perder el trabajo de alguien por un
   *  caso de borde. */
  function estadoDe(pieza: PiezaParaRevisar): EstadoPieza {
    return (
      estados[pieza.id] ?? {
        veredicto: pieza.veredicto,
        comentario: pieza.comentario,
        guardando: false,
        error: null,
        pidiendoCambio: false,
      }
    );
  }

  function parchar(id: string, cambio: Partial<EstadoPieza>) {
    setEstados((previo) => {
      const base =
        previo[id] ?? { veredicto: null, comentario: null, guardando: false, error: null, pidiendoCambio: false };
      return { ...previo, [id]: { ...base, ...cambio } };
    });
  }

  /** El try/catch no es decorativo, y no lo puse hasta que le piqué al
   *  botón con la base de datos caída: una server action que revienta
   *  —conexión perdida, despliegue a media petición, el celular cambiando
   *  de antena— rechaza la promesa en vez de devolver `{ success: false }`.
   *  Sin esto, `guardando` se quedaba en true y el botón giraba para
   *  siempre sin decir nada. En el teléfono de un cliente, con señal mala,
   *  eso no es un caso de borde: es el martes. */
  async function responder(id: string, veredicto: "aprobado" | "cambios", comentario?: string) {
    parchar(id, { guardando: true, error: null });
    try {
      const res = await conLimite(responderPieza({ token, piezaId: id, veredicto, comentario }));
      if (!res.success) {
        parchar(id, { guardando: false, error: res.error });
        return;
      }
      parchar(id, {
        guardando: false,
        error: null,
        veredicto,
        comentario: comentario?.trim() || null,
        pidiendoCambio: false,
      });
    } catch (err) {
      parchar(id, {
        guardando: false,
        error:
          err instanceof SeVencio
            ? "Está tardando más de lo normal. Puede que sí se haya guardado: recarga la página para ver."
            : "No se pudo guardar. Revisa tu señal y vuelve a intentar.",
      });
    }
  }

  async function cerrar() {
    setCerrando(true);
    setErrorAlCerrar(null);
    try {
      const res = await conLimite(cerrarRevision(token));
      if (res.success) setCerrada(true);
      else setErrorAlCerrar(res.error);
    } catch (err) {
      setErrorAlCerrar(
        err instanceof SeVencio
          ? "Está tardando más de lo normal. Recarga la página para ver si quedó."
          : "No se pudo guardar. Revisa tu señal y vuelve a intentar.",
      );
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="min-h-svh bg-[var(--background)] pb-28">
      {/* El encabezado se queda pegado con el avance adentro. En una lista
          de doce piezas en un teléfono, el contador es lo que hace que se
          termine: sin él no se sabe si falta una o faltan nueve. */}
      <header className="sticky top-0 z-10 border-b border-[var(--hairline)] bg-[var(--background)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <FramesMark className="h-5 w-5 text-zinc-950" />
            <span className="text-sm font-semibold tracking-[0.18em] text-zinc-950">FRAMES</span>
          </div>
          <p className="text-xs font-medium text-zinc-600">
            {revisadas} de {piezas.length} revisadas
          </p>
        </div>
        <div className="h-0.5 w-full bg-zinc-200">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{ width: `${(revisadas / piezas.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pt-8">
        <h1 className="text-balance text-3xl font-semibold leading-[1.05] tracking-tight text-zinc-950">
          Tu mes de {mes}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
          {piezas.length} piezas para {marca}. Ve una por una y dinos si va o si le cambiamos algo.
          Nada se publica hasta que lo apruebes.
        </p>

        {cerrada && (
          <div className="mt-6 rounded-2xl bg-emerald-50 px-5 py-4">
            <p className="text-sm font-semibold text-emerald-900">Ya cerraste esta revisión.</p>
            <p className="mt-1 text-sm leading-relaxed text-emerald-800">
              Nos pusimos a trabajar en lo que pediste. Si se te ocurre algo más, cámbialo aquí
              mismo y nos llega.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-5">
          {piezas.map((pieza) => (
            <Tarjeta
              key={pieza.id}
              pieza={pieza}
              estado={estadoDe(pieza)}
              onAprobar={() => void responder(pieza.id, "aprobado")}
              onPedirCambio={() => parchar(pieza.id, { pidiendoCambio: true, error: null })}
              onMandarCambio={(texto) => void responder(pieza.id, "cambios", texto)}
              onCancelarCambio={() => parchar(pieza.id, { pidiendoCambio: false, error: null })}
            />
          ))}
        </div>
      </main>

      {/* El cierre es un botón y no algo que se deduzca de que ya no
          faltan piezas: se puede querer cerrar dejando dos sin contestar,
          y se puede contestar todo y seguir pensándolo. Quien produce
          necesita una señal clara de cuándo empezar. */}
      {!cerrada && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--hairline)] bg-[var(--background)]/95 px-5 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-2">
            <Button onClick={() => void cerrar()} loading={cerrando} size="lg" className="w-full sm:w-auto">
              Ya terminé de revisar
            </Button>
            {errorAlCerrar && (
              <p role="alert" className="text-xs font-medium text-red-700">
                {errorAlCerrar}
              </p>
            )}
            {!errorAlCerrar && faltan > 0 && (
              <p className="text-xs text-zinc-500">
                {faltan === 1 ? "Falta 1 pieza sin contestar" : `Faltan ${faltan} piezas sin contestar`} — puedes cerrar
                igual.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
