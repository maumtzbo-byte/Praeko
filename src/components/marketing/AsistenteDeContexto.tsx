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

          <div className="flex flex-col gap-2">
            {opciones.map((estilo) => {
              const marcado = estilos.includes(estilo.id);
              const foto = imagenDeEstilo(estilo);
              return (
                <button
                  key={estilo.id}
                  type="button"
                  aria-pressed={marcado}
                  onClick={() =>
                    setEstilos((previo) =>
                      previo.includes(estilo.id)
                        ? previo.filter((x) => x !== estilo.id)
                        : [...previo, estilo.id],
                    )
                  }
                  className={`flex items-center gap-3 rounded-2xl p-2.5 text-left transition-all ${
                    marcado
                      ? "bg-[image:var(--plastico)] shadow-[var(--relieve-oprimido)]"
                      : "bg-[image:var(--plastico)] shadow-[var(--relieve-pieza)] active:translate-y-px"
                  }`}
                >
                  {/* La muestra del estilo, que es lo que de verdad se
                      está eligiendo. Sin ella la lista son renglones de
                      texto, y el estilo es justo lo que no se explica con
                      palabras.
                      
                      Si ya existe la foto de ejemplo se usa la foto; si no,
                      el degradado de respaldo. Soltar el archivo en
                      public/estilos/ y agregar su id a ESTILOS_CON_FOTO es
                      todo lo que hace falta para estrenarla. */}
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={foto}
                      alt=""
                      aria-hidden="true"
                      className="h-14 w-14 shrink-0 rounded-xl object-cover shadow-[var(--relieve-hundido)]"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="h-14 w-14 shrink-0 rounded-xl shadow-[var(--relieve-hundido)]"
                      style={{ backgroundImage: estilo.muestra }}
                    />
                  )}
                  {/* La marca va de título y el estilo debajo, no al
                      revés. "Aesop" le dice más en un segundo a quien
                      vende skincare que cualquier descripción que yo
                      escriba. Donde no hay marca —tés, salsas,
                      suplementos, joyería— sube el nombre del estilo, y
                      la tarjeta conserva su forma porque la descripción
                      siempre está. */}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-tight tracking-tight text-zinc-950">
                      {tituloDeEstilo(estilo)}
                    </span>
                    <span className="mt-0.5 block text-[13px] leading-snug text-zinc-500">
                      {estilo.descripcion}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                      marcado ? "bg-accent text-white" : "bg-zinc-200"
                    }`}
                  >
                    {marcado && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* El texto cambia según si eligió estilo, y no por adorno:
              "Listo, mándame la muestra" anunciaba que él terminó de
              llenar algo. Lo que importa no es que terminó, es lo que va a
              recibir — y si acaba de señalar un estilo, nombrarlo es la
              forma más corta de decirle que se le va a hacer caso. */}
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
            {estilos.length > 0 ? "Quiero ver mi producto así" : "A ver cómo queda"}
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
