"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Check, CheckCircle2, MessageSquare, RotateCcw, Undo2, X } from "lucide-react";

import { cerrarRevision, marcarAbierta, responderPieza } from "@/app/aprobar/[token]/actions";
import { diaCorto } from "@/lib/aprobacion/liga";
import { primerCuadro } from "@/lib/content/media";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FramesMark } from "@/components/brand/FramesMark";

/**
 * La revisión del mes, como baraja: una pieza a la vez, y se avienta.
 *
 * Se diseñó para el teléfono y no por costumbre: esta liga llega por
 * WhatsApp y quien la abre lo hace con el pulgar, de pie, entre dos cosas.
 * Aventar la tarjeta despacha una pieza en medio segundo, y ese ritmo es
 * lo que hace que alguien termine veinte y no abandone en la séptima.
 *
 * La baraja tiene dos agujeros conocidos, y los dos están tapados aquí:
 *
 *   · No se ve el mes junto. Una pieza a la vez impide notar que hablaste
 *     tres veces del mismo serum. Por eso al final NO se acaba la página:
 *     se abre un resumen con todo el mes y su veredicto, y desde ahí se
 *     puede volver a cualquier pieza.
 *   · No se puede regresar con scroll. En una lista, un clic equivocado se
 *     corrige subiendo; aquí la tarjeta ya voló. Por eso hay "deshacer",
 *     y es lo único que no se puede quitar de este diseño.
 *
 * Y aventar a la izquierda NO despacha la pieza: abre el cuadro de texto
 * en la misma tarjeta. Un "cámbiala" sin decir qué regresa la pieza a
 * producción sin instrucciones, así que el gesto pide el texto antes de
 * dejarla ir.
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

const FORMATOS: Record<string, string> = {
  reel: "Reel",
  carrusel: "Carrusel",
  imagen_unica: "Imagen",
  promocion: "Promoción",
};

/** Cuánto hay que arrastrar para que cuente.
 *
 *  120 px es bastante más que un roce: en un teléfono de 390 px es casi un
 *  tercio de la pantalla. Alto a propósito, porque un "aprobado" por
 *  accidente aquí termina publicado en el Instagram de alguien. La
 *  velocidad también cuenta, para el que avienta rápido y corto. */
const UMBRAL_PX = 120;
const UMBRAL_VELOCIDAD = 600;

/** Cuánto vive el "deshacer" antes de irse. Suficiente para reaccionar a
 *  un error, corto para no estorbar. */
const DESHACER_MS = 6000;

/** Le pone techo a una espera.
 *
 *  Le piqué al botón con la base de datos inalcanzable esperando ver un
 *  error, y lo que vi fue un botón girando a los seis segundos sin decir
 *  nada. supabase-js no trae tiempo límite en su fetch, así que una base
 *  lenta deja la promesa pendiente para siempre. Un try/catch no alcanza
 *  para eso: no hay nada que atrapar.
 *
 *  El mensaje al vencerse dice que PUEDE no haberse guardado, no que
 *  falló: el servidor pudo escribir y perder la respuesta de regreso.
 *  Prometer que no se guardó sería adivinar, y da igual para quien lo lee
 *  porque volver a mandar el mismo veredicto deja la pieza igual. */
const LIMITE_MS = 20_000;

class SeVencio extends Error {}

function conLimite<T>(promesa: Promise<T>): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new SeVencio()), LIMITE_MS)),
  ]);
}

function mensajeDeError(err: unknown): string {
  return err instanceof SeVencio
    ? "Está tardando más de lo normal. Puede que sí se haya guardado: recarga para ver."
    : "No se pudo guardar. Revisa tu señal y vuelve a intentar.";
}

function Medio({ pieza, className = "" }: { pieza: PiezaParaRevisar; className?: string }) {
  if (!pieza.medio) {
    // Sin archivo todavía: se dice, no se disimula con un recuadro de
    // color. Hay que poder distinguir "no está lista" de "así quedó".
    return (
      <div
        className={`flex items-center justify-center rounded-2xl bg-zinc-100 px-6 text-center shadow-[var(--relieve-hundido)] ${className}`}
      >
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
        className={`rounded-2xl bg-zinc-900 object-cover ${className}`}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={pieza.medio}
      alt={pieza.titulo}
      draggable={false}
      className={`rounded-2xl bg-zinc-100 object-cover ${className}`}
    />
  );
}

/** Los sellos de APROBADA / CAMBIO que aparecen al arrastrar. Son la única
 *  forma de saber qué va a pasar ANTES de soltar; sin ellos, el gesto se
 *  aprende soltando, o sea equivocándose una vez. */
function Sello({
  texto,
  tono,
  lado,
  opacidad,
}: {
  texto: string;
  tono: "si" | "no";
  lado: "izquierda" | "derecha";
  opacidad: ReturnType<typeof useTransform<number, number>>;
}) {
  return (
    <motion.span
      aria-hidden="true"
      style={{ opacity: opacidad }}
      className={`pointer-events-none absolute top-6 z-10 rounded-xl border-[3px] px-3 py-1.5 text-sm font-bold uppercase tracking-wider ${
        lado === "derecha" ? "left-5 -rotate-12" : "right-5 rotate-12"
      } ${
        tono === "si"
          ? "border-emerald-600 bg-emerald-50/90 text-emerald-700"
          : "border-amber-600 bg-amber-50/90 text-amber-700"
      }`}
    >
      {texto}
    </motion.span>
  );
}

function TarjetaDeBaraja({
  pieza,
  guardando,
  error,
  onAprobar,
  onMandarCambio,
  onDespues,
}: {
  pieza: PiezaParaRevisar;
  guardando: boolean;
  error: string | null;
  onAprobar: () => void;
  onMandarCambio: (texto: string) => void;
  onDespues: () => void;
}) {
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState(pieza.comentario ?? "");
  const reducirMovimiento = useReducedMotion();

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-9, 0, 9]);
  const selloSi = useTransform(x, [40, 130], [0, 1]);
  const selloNo = useTransform(x, [-130, -40], [1, 0]);

  // Mientras escribe el cambio, el arrastre se apaga: la tarjeta tiene un
  // campo de texto adentro y arrastrarla al intentar seleccionar una
  // palabra sería exasperante.
  const arrastrable = !escribiendo && !guardando;

  return (
    <motion.article
      drag={arrastrable ? "x" : false}
      dragSnapToOrigin
      dragElastic={0.55}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        const fuerza = info.offset.x + info.velocity.x / 8;
        if (info.offset.x > UMBRAL_PX || info.velocity.x > UMBRAL_VELOCIDAD || fuerza > 320) {
          onAprobar();
        } else if (info.offset.x < -UMBRAL_PX || info.velocity.x < -UMBRAL_VELOCIDAD || fuerza < -320) {
          setEscribiendo(true);
        }
      }}
      initial={reducirMovimiento ? false : { scale: 0.94, y: 18, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={reducirMovimiento ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="relative cursor-grab touch-pan-y rounded-3xl bg-[image:var(--plastico)] p-4 shadow-[var(--relieve-panel)] active:cursor-grabbing sm:p-5"
    >
      <Sello texto="Aprobada" tono="si" lado="derecha" opacidad={selloSi} />
      <Sello texto="Cámbiala" tono="no" lado="izquierda" opacidad={selloNo} />

      <Medio pieza={pieza} className="aspect-[4/5] w-full" />

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

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      {escribiendo ? (
        <div className="mt-4 flex flex-col gap-2">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={3}
            maxLength={1000}
            autoFocus
            placeholder="El frasco se ve muy chico, y el texto de arriba mejor que diga el precio."
            aria-label="Qué le cambiamos"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onMandarCambio(texto)}
              loading={guardando}
              disabled={texto.trim().length === 0}
              className="flex-1"
            >
              Mandar el cambio
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setEscribiendo(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Los botones se quedan aunque haya gesto. No todo el mundo
              descubre que la tarjeta se arrastra, y quien lo descubre a la
              tercera pieza ya se cansó. El gesto es el atajo; esto es el
              camino. */}
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEscribiendo(true)}
              className="flex-1"
            >
              <X className="h-4 w-4" strokeWidth={2} />
              Pedir un cambio
            </Button>
            <Button size="sm" onClick={onAprobar} loading={guardando} className="flex-1">
              <Check className="h-4 w-4" strokeWidth={2} />
              Aprobar
            </Button>
          </div>
          <button
            type="button"
            onClick={onDespues}
            className="mx-auto mt-3 block text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
          >
            No estoy seguro, déjala para el final
          </button>
        </>
      )}
    </motion.article>
  );
}

/** El resumen del mes, que es lo que una baraja normalmente no te da.
 *
 *  Aquí es donde el cliente ve por fin las veinte piezas juntas y puede
 *  notar lo que una a la vez esconde: dos publicaciones casi iguales, tres
 *  del mismo producto, un hueco de nueve días. Y desde aquí puede volver a
 *  cualquiera. */
function Resumen({
  piezas,
  veredictos,
  onRevisarDeNuevo,
  onCerrar,
  cerrando,
  errorAlCerrar,
  cerrada,
}: {
  piezas: PiezaParaRevisar[];
  veredictos: Record<string, { veredicto: "aprobado" | "cambios" | null; comentario: string | null }>;
  onRevisarDeNuevo: (id: string) => void;
  onCerrar: () => void;
  cerrando: boolean;
  errorAlCerrar: string | null;
  cerrada: boolean;
}) {
  const sinContestar = piezas.filter((p) => !veredictos[p.id]?.veredicto).length;

  return (
    <div className="mx-auto max-w-2xl px-5 pb-32 pt-8">
      <h1 className="text-balance text-3xl font-semibold leading-[1.05] tracking-tight text-zinc-950">
        Tu mes completo
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-zinc-600">
        Ahora sí, todo junto. Pícale a cualquiera para cambiar lo que dijiste.
      </p>

      {cerrada && (
        <div className="mt-6 rounded-2xl bg-emerald-50 px-5 py-4">
          <p className="text-sm font-semibold text-emerald-900">Ya cerraste esta revisión.</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-800">
            Nos pusimos a trabajar en lo que pediste. Si se te ocurre algo más, cámbialo aquí mismo y
            nos llega.
          </p>
        </div>
      )}

      <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {piezas.map((pieza) => {
          const v = veredictos[pieza.id]?.veredicto ?? null;
          return (
            <button
              key={pieza.id}
              type="button"
              onClick={() => onRevisarDeNuevo(pieza.id)}
              className="rounded-2xl bg-[image:var(--plastico)] p-2.5 text-left shadow-[var(--relieve-pieza)] transition-transform active:translate-y-px"
            >
              <Medio pieza={pieza} className="aspect-square w-full" />
              <p className="mt-2 line-clamp-2 text-[12px] font-medium leading-tight text-zinc-800">
                {pieza.titulo}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500">{diaCorto(pieza.fecha)}</p>
              <span
                className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold ${
                  v === "aprobado"
                    ? "text-emerald-700"
                    : v === "cambios"
                      ? "text-amber-700"
                      : "text-zinc-400"
                }`}
              >
                {v === "aprobado" && <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />}
                {v === "cambios" && <MessageSquare className="h-3 w-3" strokeWidth={2.5} />}
                {v === "aprobado" ? "Aprobada" : v === "cambios" ? "Con cambios" : "Sin contestar"}
              </span>
            </button>
          );
        })}
      </div>

      {!cerrada && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--hairline)] bg-[var(--background)]/95 px-5 py-4 backdrop-blur-sm">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-2">
            <Button onClick={onCerrar} loading={cerrando} size="lg" className="w-full sm:w-auto">
              Ya terminé de revisar
            </Button>
            {errorAlCerrar ? (
              <p role="alert" className="text-xs font-medium text-red-700">
                {errorAlCerrar}
              </p>
            ) : (
              sinContestar > 0 && (
                <p className="text-xs text-zinc-500">
                  {sinContestar === 1
                    ? "Falta 1 pieza sin contestar"
                    : `Faltan ${sinContestar} piezas sin contestar`}{" "}
                  — puedes cerrar igual.
                </p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type Veredictos = Record<
  string,
  { veredicto: "aprobado" | "cambios" | null; comentario: string | null }
>;

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
  const [veredictos, setVeredictos] = useState<Veredictos>(() =>
    Object.fromEntries(piezas.map((p) => [p.id, { veredicto: p.veredicto, comentario: p.comentario }])),
  );

  /** La fila de la baraja: ids por revisar, en orden. Arranca con las que
   *  no tienen veredicto — al recargar a media revisión no tiene sentido
   *  volver a pasar por las que ya contestó. */
  const [fila, setFila] = useState<string[]>(() =>
    piezas.filter((p) => !p.veredicto).map((p) => p.id),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ultima, setUltima] = useState<{ id: string; antes: Veredictos[string] } | null>(null);
  const [cerrada, setCerrada] = useState(yaCerrada);
  const [cerrando, setCerrando] = useState(false);
  const [errorAlCerrar, setErrorAlCerrar] = useState<string | null>(null);

  const porId = useMemo(() => new Map(piezas.map((p) => [p.id, p])), [piezas]);
  const actual = fila.length > 0 ? porId.get(fila[0]) : undefined;
  const siguientes = fila.slice(1, 3);
  const revisadas = piezas.length - piezas.filter((p) => !veredictos[p.id]?.veredicto).length;

  useEffect(() => {
    // Fuego y olvido, pero con el catch puesto: una promesa rechazada sin
    // atrapar se vuelve un error de consola en la primera pantalla que ve
    // el cliente, y no arregla nada.
    marcarAbierta(token).catch(() => {});
  }, [token]);

  // El "deshacer" se retira solo. Sin esto se quedaría flotando sobre el
  // resumen para siempre, invitando a deshacer algo de hace diez minutos.
  useEffect(() => {
    if (!ultima) return;
    const reloj = setTimeout(() => setUltima(null), DESHACER_MS);
    return () => clearTimeout(reloj);
  }, [ultima]);

  async function responder(id: string, veredicto: "aprobado" | "cambios", comentario?: string) {
    setGuardando(true);
    setError(null);
    const antes = veredictos[id] ?? { veredicto: null, comentario: null };
    try {
      const res = await conLimite(responderPieza({ token, piezaId: id, veredicto, comentario }));
      if (!res.success) {
        setError(res.error);
        return;
      }
      setVeredictos((previo) => ({
        ...previo,
        [id]: { veredicto, comentario: comentario?.trim() || null },
      }));
      setFila((previo) => previo.filter((x) => x !== id));
      setUltima({ id, antes });
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setGuardando(false);
    }
  }

  /** Deshacer: regresa la tarjeta al frente de la fila y restaura lo que
   *  había antes en el servidor.
   *
   *  Es lo único que no se puede quitar de una baraja. En una lista, un
   *  clic equivocado se corrige subiendo; aquí la tarjeta ya voló y sin
   *  esto habría que escribirnos por chat para corregir un resbalón, que
   *  es justo el ida y vuelta que esta página existe para evitar. */
  async function deshacer() {
    if (!ultima) return;
    const { id, antes } = ultima;
    setUltima(null);
    setFila((previo) => [id, ...previo.filter((x) => x !== id)]);
    setVeredictos((previo) => ({ ...previo, [id]: antes }));

    // Si antes no tenía veredicto no hay nada que reescribir: el servidor
    // se queda con el último, y la pieza vuelve al frente para contestarla
    // de nuevo. Reescribir "sin veredicto" pediría una acción que borra, y
    // no vale la pena por un caso que se corrige en el siguiente gesto.
    if (antes.veredicto) {
      try {
        await conLimite(
          responderPieza({
            token,
            piezaId: id,
            veredicto: antes.veredicto,
            comentario: antes.comentario ?? undefined,
          }),
        );
      } catch {
        // Silencio a propósito: la tarjeta ya regresó a la pantalla y el
        // cliente va a volver a contestarla, lo que reescribe el veredicto
        // de todos modos.
      }
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
      setErrorAlCerrar(mensajeDeError(err));
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="min-h-svh bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-[var(--hairline)] bg-[var(--background)]/95 backdrop-blur-sm">
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

      {actual ? (
        <main className="mx-auto max-w-md px-5 pb-10 pt-7">
          <h1 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-zinc-950">
            Tu mes de {mes}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
            {piezas.length} piezas para {marca}. Avienta a la derecha si va, a la izquierda si le
            cambiamos algo. Nada se publica hasta que lo apruebes.
          </p>

          {/* La baraja: la de enfrente se arrastra, las de atrás solo dan
              profundidad. Se pintan con el mismo plástico y relieve del
              resto del sitio, escaladas y empujadas hacia abajo, para que
              se lea como un montón de piezas físicas y no como una sola
              tarjeta suelta en la pantalla. */}
          <div className="relative mt-6">
            {/* El naipe de atrás se desplaza con `top`/`left`/`right` y no
                con `scale`: escalado desde el centro, un naipe 3.5% más
                chico se mete ENTERO debajo del de enfrente y no asoma por
                ningún lado — lo vi en la captura, donde la baraja parecía
                una sola tarjeta suelta. Con un desplazamiento hacia abajo
                mayor que cero, asoma por el canto, que es lo que hace que
                se lea como un montón.

                Y sin z-index negativo: eso los mandaba detrás del fondo de
                la página y desaparecían. El orden lo da el DOM — estos van
                antes, la tarjeta de enfrente va después y es `relative`,
                así que queda encima sin necesidad de números. */}
            {siguientes.map((id, i) => (
              <div
                key={id}
                aria-hidden="true"
                className="absolute h-full rounded-3xl bg-[image:var(--plastico)] shadow-[var(--relieve-pieza)]"
                style={{
                  top: (i + 1) * 15,
                  left: (i + 1) * 9,
                  right: (i + 1) * 9,
                }}
              />
            ))}
            <AnimatePresence mode="popLayout">
              <TarjetaDeBaraja
                key={actual.id}
                pieza={actual}
                guardando={guardando}
                error={error}
                onAprobar={() => void responder(actual.id, "aprobado")}
                onMandarCambio={(texto) => void responder(actual.id, "cambios", texto)}
                onDespues={() => setFila((previo) => [...previo.slice(1), previo[0]])}
              />
            </AnimatePresence>
          </div>
        </main>
      ) : (
        <Resumen
          piezas={piezas}
          veredictos={veredictos}
          onRevisarDeNuevo={(id) => setFila([id])}
          onCerrar={() => void cerrar()}
          cerrando={cerrando}
          errorAlCerrar={errorAlCerrar}
          cerrada={cerrada}
        />
      )}

      {/* El deshacer flota sobre todo y se va solo a los seis segundos. */}
      <AnimatePresence>
        {ultima && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-5 left-1/2 z-30 -translate-x-1/2"
          >
            <button
              type="button"
              onClick={() => void deshacer()}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white shadow-lg active:translate-y-px"
            >
              <Undo2 className="h-4 w-4" strokeWidth={2} />
              Deshacer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Una salida al resumen sin tener que despachar toda la baraja: hay
          gente que quiere ver el mes completo antes de opinar de nada, y
          obligarla a contestar doce piezas primero para poder verlo es
          esconderle su propio contenido. */}
      {actual && revisadas > 0 && (
        <button
          type="button"
          onClick={() => setFila([])}
          className="mx-auto mb-10 block text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
        >
          <RotateCcw className="mr-1 inline h-3 w-3" strokeWidth={2} />
          Ver el mes completo
        </button>
      )}
    </div>
  );
}
