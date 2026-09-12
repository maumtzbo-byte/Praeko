"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { completarContexto, registrarProspecto } from "@/app/prueba/actions";
import { CATEGORIAS_PRODUCTO } from "@/lib/validation/lead";
import { ligaWhatsapp, MENSAJE_MUESTRA, WHATSAPP_VISIBLE } from "@/lib/contacto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SubidaDeFotos } from "@/components/marketing/SubidaDeFotos";

/**
 * El formulario de /prueba, en dos pasos.
 *
 * La tensión que resuelve: con cuatro datos —nombre, marca, categoría,
 * teléfono— el agente de estrategia no tiene de dónde agarrarse y, peor,
 * no tiene ni una foto del producto, que es el insumo sin el cual no hay
 * pieza. La muestra saldría genérica. Y la muestra es lo único que vende, así que una
 * muestra genérica no sirve de nada. Pero un formulario de ocho campos en
 * una página detrás de anuncios pagados espanta prospectos.
 *
 * Partirlo resuelve las dos: el paso 1 son los cuatro campos y AL
 * MANDARLO el prospecto ya quedó guardado. El paso 2 pide lo que la IA
 * necesita de verdad, ya sin riesgo — quien lo abandone sigue siendo un
 * prospecto que tienes en la base y al que le puedes escribir.
 *
 * El paso 2 se vende como lo que es: "esto hace que la muestra salga más
 * parecida a lo tuyo". No es un trámite más, es la razón por la que va a
 * quedar bien.
 */

type Paso = "datos" | "contexto" | "listo";

export function LeadForm() {
  const parametros = useSearchParams();
  const [paso, setPaso] = useState<Paso>("datos");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviarDatos(formulario: FormData) {
    setEnviando(true);
    setError(null);
    const resultado = await registrarProspecto({
      nombre: formulario.get("nombre"),
      negocio: formulario.get("negocio"),
      giro: formulario.get("giro"),
      whatsapp: formulario.get("whatsapp"),
      // De qué anuncio vino, para poder separar el tráfico de cada
      // creatividad sin depender del pixel de Meta.
      origen: parametros.get("origen") ?? undefined,
    });
    setEnviando(false);
    if (!resultado.success) {
      setError(resultado.error);
      return;
    }
    // Sin id significa que ya se había registrado antes: no tiene caso
    // volver a pedirle el contexto.
    setLeadId(resultado.leadId);
    setPaso(resultado.leadId ? "contexto" : "listo");
  }

  async function enviarContexto(formulario: FormData) {
    if (!leadId) return setPaso("listo");
    setEnviando(true);
    setError(null);
    const resultado = await completarContexto({
      leadId,
      vende: formulario.get("vende") || undefined,
      ciudad: formulario.get("ciudad") || undefined,
      preguntan: formulario.get("preguntan") || undefined,
      instagram: formulario.get("instagram") || undefined,
      sitioWeb: formulario.get("sitioWeb") || undefined,
    });
    setEnviando(false);
    // Aunque falle se pasa a "listo": el prospecto ya está capturado desde
    // el paso 1 y dejarlo atorado en un error, después de que YA te dejó
    // sus datos, sería el peor momento posible para frenarlo.
    if (!resultado.success) console.error(resultado.error);
    setPaso("listo");
  }

  if (paso === "listo") {
    return (
      <div className="rounded-3xl bg-[image:var(--plastico)] p-7 shadow-[var(--relieve-panel)] sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950">Quedó.</h2>
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-zinc-600">
          En menos de 24 horas te escribo por WhatsApp con tres piezas hechas con tu producto. Si no
          te laten, ahí queda y no me debes nada.
        </p>
        <a
          href={ligaWhatsapp(MENSAJE_MUESTRA)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex rounded-full bg-[image:var(--plastico)] px-5 py-2.5 text-sm font-medium text-zinc-800 shadow-[var(--relieve-pieza)] transition-all hover:brightness-[1.02] active:translate-y-px"
        >
          Escríbeme tú primero
        </a>
      </div>
    );
  }

  if (paso === "contexto") {
    return (
      <form
        action={enviarContexto}
        className="rounded-3xl bg-[image:var(--plastico)] p-6 shadow-[var(--relieve-panel)] sm:p-7"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold tracking-tight text-zinc-950">
                Ya quedaste. ¿Le damos contexto?
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                Súbenos una foto de tu producto y la muestra sale con él. Son 30 segundos y puedes
                saltártelo.
              </p>
            </div>
          </div>

          {/* Las fotos van primero y no al final. Son el insumo del que
              depende todo lo demás: sin una foto del producto no hay pieza
              que hacer, y los otros campos nada más la afinan. */}
          <div className="flex flex-col gap-2">
            <Label>Fotos de tu producto</Label>
            <SubidaDeFotos leadId={leadId!} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="vende">¿Cuál producto usamos?</Label>
            <Input id="vende" name="vende" placeholder="El serum de niacinamida" />
          </div>

          {/* Salió "¿de qué ciudad?" y entró el sitio. La ciudad servía
              cuando el cliente era un negocio local y el agente de
              Tendencias buscaba qué funciona "en tu zona"; una marca que
              vende en línea le vende a todo el país. El sitio, en cambio,
              es de donde se saca su tono, su catálogo y cómo se describe a
              sí misma. La columna `ciudad` se queda en la base por si
              vuelve. */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="sitioWeb">Tu tienda en línea</Label>
            <Input id="sitioWeb" name="sitioWeb" placeholder="botanicanorte.com" />
            <p className="text-xs leading-snug text-zinc-500">Si no tienes, sáltatelo.</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preguntan">¿Qué es lo que más te preguntan tus clientes?</Label>
            <Textarea
              id="preguntan"
              name="preguntan"
              rows={2}
              className="min-h-[64px]"
              placeholder="De qué está hecho, cuánto rinde, si sirve para piel grasa"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instagram">El Instagram de tu marca</Label>
            <Input id="instagram" name="instagram" placeholder="@tumarca" />
          </div>

          <Button type="submit" size="lg" disabled={enviando} className="mt-1 w-full">
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            Listo, mándame la muestra
          </Button>

          <button
            type="button"
            onClick={() => setPaso("listo")}
            className="text-center text-xs font-medium text-zinc-500 underline underline-offset-2 hover:text-zinc-700"
          >
            Saltar, ya luego platicamos
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      action={enviarDatos}
      className="rounded-3xl bg-[image:var(--plastico)] p-6 shadow-[var(--relieve-panel)] sm:p-7"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre">Tu nombre</Label>
          <Input id="nombre" name="nombre" required autoComplete="name" placeholder="Mauricio" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="negocio">Tu marca</Label>
          <Input id="negocio" name="negocio" required placeholder="Botánica Norte" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="giro">¿Qué tipo de producto vendes?</Label>
          <Select id="giro" name="giro" required defaultValue="">
            <option value="" disabled>
              Elige una opción
            </option>
            {CATEGORIAS_PRODUCTO.map((giro) => (
              <option key={giro} value={giro}>
                {giro}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="81 1234 5678"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={enviando} className="mt-1 w-full">
          {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
          Quiero ver mis 3 piezas
        </Button>

        <p className="text-center text-xs leading-snug text-zinc-500">
          Sin costo y sin compromiso. Te escribo yo al {WHATSAPP_VISIBLE}, no un robot.
        </p>
      </div>
    </form>
  );
}
