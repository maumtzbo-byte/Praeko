"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";

import { completarContexto } from "@/app/prueba/actions";
import { conLimite } from "@/lib/espera";
import { estilosPara, imagenDeEstilo, tituloDeEstilo } from "@/lib/marketing/estilos";
import { SubidaDeFotos } from "@/components/marketing/SubidaDeFotos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * El contexto de la muestra, de a una sección.
 *
 * Antes era un solo formulario con seis campos. Funcionaba, pero seis
 * campos juntos se ven como un trámite y la mitad de la gente cierra sin
 * llenar ninguno. De a uno se ve como una plática.
 *
 * Tres decisiones que lo sostienen:
 *
 *   · El prospecto YA está guardado antes de llegar aquí. El paso 1
 *     —nombre, marca, WhatsApp— se manda solo, así que alargar esta parte
 *     no cuesta prospectos: cuesta contexto, y a quien lo abandone lo
 *     tienes igual en la base para escribirle.
 *   · Cada sección se guarda al pasar a la siguiente, no todo al final.
 *     Quien se salga en la cuarta deja tres secciones guardadas.
 *   · La sección del negocio SOLO aparece si no hubo sitio web. Con una
 *     URL en la mano esas preguntas se contestan solas; pedirlas de todos
 *     modos es hacerle trabajo a alguien que ya te dio el atajo.
 */

type Seccion = "sitio" | "negocio" | "fotos" | "estilo";

/** El id que guarda "ninguna de estas".
 *
 *  Se guarda como una respuesta y no como un arreglo vacío porque las dos
 *  cosas son distintas: vacío es "no contestó", y esto es "las vi y no me
 *  laten". La segunda dice que su gusto va por otro lado y que hay que
 *  preguntarle; la primera no dice nada.
 *
 *  `instruccionDeEstilos` lo ignora solo, porque filtra contra los estilos
 *  conocidos. */
const NINGUNA = "ninguna";

export function AsistenteDeContexto({
  leadId,
  categoria,
  onListo,
}: {
  leadId: string;
  categoria: string;
  onListo: () => void;
}) {
  const [seccion, setSeccion] = useState<Seccion>("sitio");
  const [sitio, setSitio] = useState("");
  const [tieneSitio, setTieneSitio] = useState<boolean | null>(null);
  const [vende, setVende] = useState("");
  const [preguntan, setPreguntan] = useState("");
  const [instagram, setInstagram] = useState("");
  const [estilos, setEstilos] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opciones = estilosPara(categoria);

  // Las que de verdad se van a ver, para la barra de avance. Se calcula y
  // no se escribe a mano porque la del negocio aparece o no según lo que
  // haya contestado en la primera.
  //
  // Mientras no ha contestado se asume el recorrido LARGO, y eso es a
  // propósito. Al revés el contador iba de 1/3 a 2/4 al decir "no tengo",
  // que se lee como si hubiera retrocedido. Así va de 1/4 a 2/4 si no
  // tiene, y de 1/4 a 2/3 si sí — o sea que dar la URL se siente como
  // brincarse un paso, que es exactamente lo que pasó.
  const recorrido: Seccion[] =
    tieneSitio === true ? ["sitio", "fotos", "estilo"] : ["sitio", "negocio", "fotos", "estilo"];
  const posicion = recorrido.indexOf(seccion) + 1;

  /** Guarda lo de esta sección y pasa a la siguiente.
   *
   *  Si el guardado falla NO se frena el avance: el prospecto ya está
   *  capturado desde el paso 1 y dejarlo atorado en un error, después de
   *  que ya te dio sus datos, sería el peor momento posible para pararlo.
   *  El error se enseña y la sección continúa. */
  async function guardarYSeguir(datos: Record<string, unknown>, siguiente: Seccion | "fin") {
    setGuardando(true);
    setError(null);
    try {
      const res = await conLimite(completarContexto({ leadId, ...datos }));
      if (!res.success) setError("Eso último no se guardó. No te preocupes, te lo pregunto por WhatsApp.");
    } catch {
      setError("Eso último no se guardó. No te preocupes, te lo pregunto por WhatsApp.");
    } finally {
      setGuardando(false);
      if (siguiente === "fin") onListo();
      else setSeccion(siguiente);
    }
  }

  const marco = "rounded-3xl bg-[image:var(--plastico)] p-6 shadow-[var(--relieve-panel)] sm:p-7";

  return (
    <div className={marco}>
      {/* El avance, arriba. Sin él, un asistente de cuatro pasos se siente
          infinito: no se sabe si falta uno o faltan seis. */}
      <div className="mb-5 flex items-center gap-2">
        {recorrido.map((s, i) => (
          <span
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i < posicion ? "bg-accent" : "bg-zinc-200"
            }`}
          />
        ))}
        <span className="ml-1 shrink-0 text-[11px] font-medium tabular-nums text-zinc-500">
          {posicion}/{recorrido.length}
        </span>
      </div>

      {/* El aviso va en gris y no en rojo, y no dice "error".
          
          Si el guardado de una sección falla, el prospecto no puede hacer
          nada al respecto: es nuestro servidor, no su culpa ni su
          problema. Y como el avance NO se frena —ya está capturado desde
          el paso 1—, el aviso termina apareciendo en la pantalla
          siguiente. Un renglón rojo dos secciones después, por algo que no
          puede arreglar, solo lo asusta a media conversión.
          
          Lo que sí sirve es decirle que eso se retoma por WhatsApp, que es
          verdad y es donde de todos modos va a seguir la plática. */}
      {error && (
        <p className="mb-3 rounded-xl bg-zinc-100 px-3 py-2 text-[13px] leading-snug text-zinc-600 shadow-[var(--relieve-hundido)]">
          {error}
        </p>
      )}

      {seccion === "sitio" && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight text-zinc-950">
              ¿Tienes tienda en línea?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              Con verla ya sabemos cómo hablas y qué vendes, y te pregunto menos.
            </p>
          </div>
          <Input
            value={sitio}
            onChange={(e) => setSitio(e.target.value)}
            placeholder="botanicanorte.com"
            aria-label="Tu tienda en línea"
            autoFocus
          />
          <Button
            size="lg"
            loading={guardando}
            disabled={sitio.trim().length === 0}
            onClick={() => {
              setTieneSitio(true);
              void guardarYSeguir({ sitioWeb: sitio }, "fotos");
            }}
          >
            Continuar
          </Button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setTieneSitio(false);
              setSeccion("negocio");
            }}
            className="text-center text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
          >
            No tengo
          </button>
        </div>
      )}

      {seccion === "negocio" && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight text-zinc-950">
              Cuéntame de tu marca
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              Sin tienda en línea esto es lo único que tengo para conocerte.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vende">¿Cuál producto usamos para la muestra?</Label>
            <Input
              id="vende"
              value={vende}
              onChange={(e) => setVende(e.target.value)}
              placeholder="El serum de niacinamida"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preguntan">¿Qué te preguntan más tus clientes?</Label>
            <Textarea
              id="preguntan"
              value={preguntan}
              onChange={(e) => setPreguntan(e.target.value)}
              rows={2}
              className="min-h-[64px]"
              placeholder="De qué está hecho, cuánto rinde, si sirve para piel grasa"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instagram">Tu Instagram</Label>
            <Input
              id="instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@tumarca"
            />
          </div>
          <Button
            size="lg"
            loading={guardando}
            onClick={() => void guardarYSeguir({ vende, preguntan, instagram }, "fotos")}
          >
            Continuar
          </Button>
        </div>
      )}

      {seccion === "fotos" && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight text-zinc-950">
              Sube tu producto
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              Es lo único que de verdad necesito. Sin una foto no hay pieza que hacer.
            </p>
          </div>
          {/* Las fotos se suben y se anotan solas, así que esta sección no
              guarda nada al avanzar. */}
          <SubidaDeFotos leadId={leadId} />
          <Button
            size="lg"
            onClick={() => {
              setError(null);
              setSeccion("estilo");
            }}
          >
            Continuar
          </Button>
        </div>
      )}

      {seccion === "estilo" && (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-[17px] font-semibold tracking-tight text-zinc-950">
              ¿Cómo te gustaría verte?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              Escoge los que te laten. Puedes marcar más de uno.
            </p>
          </div>

          {/* Cuadrícula de cuadrados y no lista de renglones.
              
              Con el nombre debajo de la imagen, cada opción mide lo que
              mide su columna y no lo que mide su texto, así que "Tipo Onyx
              Coffee Lab" ocupa igual que "Tipo Aesop" y la retícula no se
              desbalancea. Y en un teléfono caben seis de un vistazo en vez
              de tres y media, que para escoger un estilo importa: se
              escoge comparando, no leyendo de arriba abajo. */}
          <div className="grid grid-cols-2 gap-2.5">
            {opciones.map((estilo) => {
              const marcado = estilos.includes(estilo.id);
              const foto = imagenDeEstilo(estilo);
              return (
                <button
                  key={estilo.id}
                  type="button"
                  aria-pressed={marcado}
                  onClick={() =>
                    setEstilos((previo) => {
                      // Elegir un estilo apaga "ninguna": son cosas
                      // contrarias y dejarlas prendidas a la vez guardaría
                      // una respuesta que no quiere decir nada.
                      const limpio = previo.filter((x) => x !== NINGUNA);
                      return limpio.includes(estilo.id)
                        ? limpio.filter((x) => x !== estilo.id)
                        : [...limpio, estilo.id];
                    })
                  }
                  className={`flex flex-col gap-2 rounded-2xl p-2.5 text-center transition-all ${
                    marcado
                      ? "bg-[image:var(--plastico)] shadow-[var(--relieve-oprimido)]"
                      : "bg-[image:var(--plastico)] shadow-[var(--relieve-pieza)] active:translate-y-px"
                  }`}
                >
                  <span className="relative block">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={foto}
                        alt=""
                        aria-hidden="true"
                        className="aspect-square w-full rounded-xl object-cover shadow-[var(--relieve-hundido)]"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="block aspect-square w-full rounded-xl shadow-[var(--relieve-hundido)]"
                        style={{ backgroundImage: estilo.muestra }}
                      />
                    )}
                    {marcado && (
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-sm">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                    )}
                  </span>
                  <span className="block px-0.5 pb-0.5">
                    <span className="block text-[13px] font-semibold leading-tight tracking-tight text-zinc-950">
                      {tituloDeEstilo(estilo)}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500">
                      {estilo.descripcion}
                    </span>
                  </span>
                </button>
              );
            })}

            {/* Ancho completo, a propósito. Es una opción de otra clase
                que las cinco de arriba, y ocupando una celda igual se veía
                como una sexta tarjeta a medio hacer: sin cuadro, más baja
                que sus vecinas, dejando la retícula despareja.

                "Ninguna" es una opción de verdad y no la ausencia de
                respuesta. Quien rechaza las cinco está diciendo algo útil
                —su gusto va por otro lado y hay que preguntarle— y eso se
                pierde si la única forma de expresarlo es no marcar nada,
                que es igual a haberse saltado la pantalla. */}
            <button
              type="button"
              aria-pressed={estilos.includes(NINGUNA)}
              onClick={() =>
                setEstilos((previo) => (previo.includes(NINGUNA) ? [] : [NINGUNA]))
              }
              className={`col-span-2 flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-3.5 text-center transition-all ${
                estilos.includes(NINGUNA)
                  ? "bg-[image:var(--plastico)] shadow-[var(--relieve-oprimido)]"
                  : "bg-[image:var(--plastico)] shadow-[var(--relieve-pieza)] active:translate-y-px"
              }`}
            >
              <span className="text-[13px] font-semibold tracking-tight text-zinc-950">
                Ninguna me late
              </span>
              <span className="text-[11px] leading-snug text-zinc-500">
                Lo platicamos por WhatsApp y te lo armo a tu gusto
              </span>
            </button>
          </div>

          {/* El deslinde, y va DEBAJO de la lista y no arriba.
              
              Arriba interrumpiría con letra chica legal justo antes de la
              única parte divertida del formulario. Abajo cumple igual —
              está a la vista, sin scroll extra, antes del botón— y no le
              quita el momento.
              
              Nombrar una marca para describir un estilo es uso referencial
              y está permitido; lo que la ley pide es que nada sugiera una
              relación que no existe. Esta frase es exactamente eso, dicho
              sin rodeos. */}
          <p className="text-xs leading-snug text-zinc-500">
            Estas marcas no trabajan con nosotros ni tienen relación con Frames. Las nombramos nada
            más para que nos digas qué estilo te late.
          </p>

          <Button
            size="lg"
            loading={guardando}
            onClick={() => void guardarYSeguir({ estilos }, "fin")}
          >
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {/* Cuenta estilos de verdad, no la longitud del arreglo:
                con "ninguna" marcada el arreglo mide uno, y el botón
                habría prometido "así" señalando a nada. */}
            {estilos.some((id) => id !== NINGUNA)
              ? "Quiero ver mi producto así"
              : "A ver cómo queda"}
          </Button>
        </div>
      )}

      <button
        type="button"
        onClick={onListo}
        className="mx-auto mt-4 block text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
      >
        Mejor luego
      </button>
    </div>
  );
}
