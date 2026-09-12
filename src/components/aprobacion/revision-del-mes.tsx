"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { Check, CheckCircle2, MessageSquare, RotateCcw, Undo2, X } from "lucide-react";

import { cerrarRevision, marcarAbierta, responderPieza } from "@/app/aprobar/[token]/actions";
import { diaCorto } from "@/lib/aprobacion/liga";
import { conLimite, mensajeDeEspera } from "@/lib/espera";
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

/** El símbolo de sí o no, flanqueando la tarjeta.
 *
 *  Sustituye a los sellos de "APROBADA / CÁMBIALA" que iban encima de la
 *  foto y a los botones con texto que iban debajo. Las dos cosas
 *  ensuciaban lo único que el cliente vino a ver, que es su producto: una
 *  tarjeta con título, guion, dos etiquetas, dos botones y un enlace se
 *  lee como un formulario, no como una pieza de contenido.
 *
 *  Van medio encimados al canto (`-left-4`) y no a un lado con su propia
 *  columna: en 390 px de ancho, dos botones flanqueando de verdad le
 *  quitarían 120 px a la foto. Así flanquean sin robar ancho.
 *
 *  Son botones de verdad, no adorno: el gesto es el atajo y esto es el
 *  camino para quien no descubre que la tarjeta se arrastra.
 *
 *  Y crecen conforme se arrastra hacia su lado. Ese es el único aviso de
 *  qué va a pasar antes de soltar; sin él, el gesto se aprende soltando,
 *  o sea equivocándose una vez. */
function SimboloDeLado({
  lado,
  x,
  onClick,
  etiqueta,
}: {
  lado: "si" | "no";
  x: MotionValue<number>;
  onClick: () => void;
  etiqueta: string;
}) {
  const esSi = lado === "si";
  const rango: [number, number] = esSi ? [20, 130] : [-130, -20];
  // Tope de 1.25 y no 1.35: a 1.35, con el voladizo anterior, el círculo
  // de "sí" se salía por el canto derecho de la pantalla y quedaba
  // rebanado justo en el momento en que más importa verlo. Medido en un
  // viewport de 390 px, que es el chico de verdad.
  const escala = useTransform(x, rango, esSi ? [1, 1.25] : [1.25, 1]);
  const brillo = useTransform(x, rango, esSi ? [0, 1] : [1, 0]);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      style={{ scale: escala }}
      className={`absolute top-1/2 z-20 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-[image:var(--plastico)] shadow-[var(--relieve-pieza)] active:translate-y-[calc(-50%+1px)] ${
        esSi ? "-right-3" : "-left-3"
      }`}
    >
      {/* El relleno de color vive en una capa aparte que aparece con el
          arrastre, para que el símbolo en reposo se vea del mismo plástico
          que todo el sitio y no como un semáforo encendido siempre. */}
      <motion.span
        aria-hidden="true"
        style={{ opacity: brillo }}
        className={`absolute inset-0 rounded-full ${esSi ? "bg-emerald-500/15" : "bg-amber-500/15"}`}
      />
      {esSi ? (
        <Check className="relative h-6 w-6 text-emerald-700" strokeWidth={2.75} />
      ) : (
        <X className="relative h-6 w-6 text-amber-700" strokeWidth={2.75} />
      )}
    </motion.button>
  );
}

/** La tarjeta: la foto y nada más.
 *
 *  El texto de la pieza —fecha, formato, título, guion— se fue ABAJO de la
 *  baraja, fuera de la tarjeta. No desapareció, y no debe: quien aprueba
 *  sin leer el texto que se va a publicar está aprobando a ciegas. Pero
 *  vive afuera, chico y apagado, para que la foto sea lo que manda. */
function TarjetaDeBaraja({
  pieza,
  x,
  arrastrable,
  onAprobar,
  onPedirCambio,
}: {
  pieza: PiezaParaRevisar;
  x: MotionValue<number>;
  arrastrable: boolean;
  onAprobar: () => void;
  onPedirCambio: () => void;
}) {
  const rotate = useTransform(x, [-260, 0, 260], [-9, 0, 9]);
  const reducirMovimiento = useReducedMotion();

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
        } else if (
          info.offset.x < -UMBRAL_PX ||
          info.velocity.x < -UMBRAL_VELOCIDAD ||
          fuerza < -320
        ) {
          onPedirCambio();
        }
      }}
      initial={reducirMovimiento ? false : { scale: 0.94, y: 18, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={reducirMovimiento ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="relative cursor-grab touch-pan-y overflow-hidden rounded-[1.75rem] bg-[image:var(--plastico)] p-2 shadow-[var(--relieve-panel)] active:cursor-grabbing"
    >
      <Medio pieza={pieza} className="aspect-[4/5] w-full" />
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
  const [escribiendo, setEscribiendo] = useState(false);
  const [texto, setTexto] = useState("");
  const [cerrada, setCerrada] = useState(yaCerrada);
  const [cerrando, setCerrando] = useState(false);
  const [errorAlCerrar, setErrorAlCerrar] = useState<string | null>(null);

  const porId = useMemo(() => new Map(piezas.map((p) => [p.id, p])), [piezas]);
  const actual = fila.length > 0 ? porId.get(fila[0]) : undefined;
  const siguientes = fila.slice(1, 3);
  const revisadas = piezas.length - piezas.filter((p) => !veredictos[p.id]?.veredicto).length;

  /** El desplazamiento del arrastre. Vive en el padre porque los símbolos
   *  de los lados tienen que crecer con él y NO se van volando con la
   *  tarjeta; si `x` viviera adentro, se irían con ella. */
  const x = useMotionValue(0);

  /** Devuelve la tarjeta a su estado de reposo.
   *
   *  Se llama en los cuatro lugares donde cambia la pieza de enfrente, y
   *  NO desde un efecto que vigile el id: reaccionar a un cambio de estado
   *  con más cambios de estado es justo lo que provoca renders en cascada,
   *  y el compilador de React lo marca como error. El cambio de tarjeta es
   *  un evento —despachar, posponer, deshacer, volver desde el resumen—,
   *  así que se limpia ahí.
   *
   *  Sin esto, la tarjeta nueva entra ya desplazada y arrastrando el
   *  comentario a medio escribir de la anterior. */
  function limpiarTarjeta() {
    x.set(0);
    setEscribiendo(false);
    setTexto("");
    setError(null);
  }

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
      setFila((previo) => previo.filter((otro) => otro !== id));
      setUltima({ id, antes });
      limpiarTarjeta();
    } catch (err) {
      setError(mensajeDeEspera(err, "Está tardando más de lo normal. Puede que sí se haya guardado: recarga para ver."));
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
    setFila((previo) => [id, ...previo.filter((otro) => otro !== id)]);
    setVeredictos((previo) => ({ ...previo, [id]: antes }));
    limpiarTarjeta();

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
      setErrorAlCerrar(mensajeDeEspera(err, "Está tardando más de lo normal. Puede que sí se haya guardado: recarga para ver."));
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

          {/* La baraja. `x` vive AQUÍ y no dentro de la tarjeta porque los
              símbolos de los lados tienen que reaccionar al arrastre y no
              se mueven con ella: si vivieran adentro, se irían volando
              junto con la foto. */}
          <div className="relative mt-7 px-4">
            {/* El naipe de atrás se desplaza con `top`/`left`/`right` y no
                con `scale`: escalado desde el centro, un naipe 3.5% más
                chico se mete ENTERO debajo del de enfrente y no asoma por
                ningún lado — lo vi en la captura, donde la baraja parecía
                una tarjeta suelta.

                Y sin z-index negativo: eso los mandaba detrás del fondo de
                la página y desaparecían. El orden lo da el DOM. */}
            {siguientes.map((id, i) => (
              <div
                key={id}
                aria-hidden="true"
                className="absolute h-full rounded-[1.75rem] bg-[image:var(--plastico)] shadow-[var(--relieve-pieza)]"
                style={{
                  top: (i + 1) * 15,
                  left: (i + 1) * 9 + 16,
                  right: (i + 1) * 9 + 16,
                }}
              />
            ))}

            <AnimatePresence mode="popLayout">
              <TarjetaDeBaraja
                key={actual.id}
                pieza={actual}
                x={x}
                arrastrable={!escribiendo && !guardando}
                onAprobar={() => void responder(actual.id, "aprobado")}
                onPedirCambio={() => setEscribiendo(true)}
              />
            </AnimatePresence>

            {/* Se esconden mientras escribe el cambio: ya decidió, y un
                "sí" a un toque de distancia del teclado es un accidente
                esperando. */}
            {!escribiendo && (
              <>
                <SimboloDeLado
                  lado="no"
                  x={x}
                  etiqueta="Pedir un cambio"
                  onClick={() => setEscribiendo(true)}
                />
                <SimboloDeLado
                  lado="si"
                  x={x}
                  etiqueta="Aprobar"
                  onClick={() => void responder(actual.id, "aprobado")}
                />
              </>
            )}
          </div>

          {/* mt-9 y no mt-6: el naipe de atrás asoma 15 px por debajo del
              de enfrente, así que con la separación anterior el canto de
              la baraja quedaba a 9 px del texto y se leía como si lo
              estuviera pisando.

              El texto de la pieza, FUERA de la tarjeta. La foto es lo que
              el cliente vino a ver y encimarle título, guion y etiquetas la
              convierte en un formulario. Pero el guion es el texto que se
              va a publicar: esconderlo del todo sería pedirle que apruebe
              a ciegas. Así que vive aquí, chico y apagado. */}
          <div className="mt-9">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              {diaCorto(actual.fecha)} · {FORMATOS[actual.formato] ?? actual.formato}
            </p>
            <p className="mt-1.5 text-[15px] font-semibold leading-snug tracking-tight text-zinc-950">
              {actual.titulo}
            </p>
            {actual.guion && (
              <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-zinc-500">
                {actual.guion}
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm font-medium text-red-700">
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
                  onClick={() => void responder(actual.id, "cambios", texto)}
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
            <button
              type="button"
              onClick={() => {
                setFila((previo) => [...previo.slice(1), previo[0]]);
                limpiarTarjeta();
              }}
              className="mx-auto mt-5 block text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
            >
              No estoy seguro, déjala para el final
            </button>
          )}
        </main>
      ) : (
        <Resumen
          piezas={piezas}
          veredictos={veredictos}
          onRevisarDeNuevo={(id) => {
            setFila([id]);
            limpiarTarjeta();
          }}
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
