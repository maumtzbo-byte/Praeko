"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { registrarProspecto } from "@/app/prueba/actions";
import { CATEGORIAS_PRODUCTO } from "@/lib/validation/lead";
import { ligaWhatsapp, MENSAJE_MUESTRA, WHATSAPP_VISIBLE } from "@/lib/contacto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AsistenteDeContexto } from "@/components/marketing/AsistenteDeContexto";
import { PantallaCompleta } from "@/components/marketing/PantallaCompleta";

/**
 * El formulario de /prueba: cuatro campos y luego un asistente.
 *
 * La tensión que resuelve: con nombre, marca, categoría y teléfono, quien
 * produce no tiene de dónde agarrarse y, peor, no tiene ni una foto del
 * producto, que es el insumo sin el cual no hay pieza. Pero un formulario
 * de ocho campos detrás de anuncios pagados espanta prospectos.
 *
 * Se resuelve partiéndolo, y el orden importa: estos cuatro campos se
 * mandan solos y AL MANDARLOS el prospecto ya quedó guardado. Todo lo que
 * viene después —el asistente por secciones— ya no arriesga nada. Quien
 * lo abandone sigue siendo un prospecto en la base al que le puedes
 * escribir.
 *
 * Por eso la tienda en línea NO puede ser la primera pregunta aunque sea
 * la más útil: quien se salga en esa pantalla se fue sin dejar rastro.
 */

type Paso = "datos" | "contexto" | "listo";

export function LeadForm() {
  const parametros = useSearchParams();
  const [paso, setPaso] = useState<Paso>("datos");
  const [leadId, setLeadId] = useState<string | null>(null);
  /** La categoría que eligió en el paso 1. La necesita el asistente para
   *  enseñarle referencias de estilo de SU nicho: quien vende café no
   *  reconoce a The Ordinary, y quien vende skincare no reconoce a Blue
   *  Bottle. */
  const [categoria, setCategoria] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviarDatos(formulario: FormData) {
    setEnviando(true);
    setError(null);
    setCategoria(String(formulario.get("giro") ?? ""));
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

  if (paso === "listo") {
    return (
      // A pantalla completa igual que el asistente. Volver aquí a la
      // columna de la página, después de que el asistente se comió la
      // pantalla, se sentiría como si algo se hubiera cerrado mal.
      <PantallaCompleta>
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950">Quedó.</h2>
        <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-zinc-600">
          En menos de 24 horas te escribo por WhatsApp con tres piezas hechas con tu producto. Si no
          te laten, ahí queda y no me debes nada.
        </p>
        <a
          href={ligaWhatsapp(MENSAJE_MUESTRA)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-7 inline-flex rounded-full bg-[image:var(--plastico)] px-5 py-3 text-sm font-medium text-zinc-800 shadow-[var(--relieve-pieza)] transition-all hover:brightness-[1.02] active:translate-y-px"
        >
          Escríbeme tú primero
        </a>
      </PantallaCompleta>
    );
  }

  if (paso === "contexto") {
    return (
      <AsistenteDeContexto
        leadId={leadId!}
        categoria={categoria}
        onListo={() => setPaso("listo")}
      />
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
          Mándame mis 3 piezas
        </Button>

        <p className="text-center text-xs leading-snug text-zinc-500">
          Sin costo y sin compromiso. Te escribo yo al {WHATSAPP_VISIBLE}, no un robot.
        </p>
      </div>
    </form>
  );
}
