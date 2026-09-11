"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { registrarProspecto } from "@/app/prueba/actions";
import { GIROS_PROSPECTO } from "@/lib/validation/lead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

/**
 * El formulario de /prueba.
 *
 * Cuatro campos obligatorios y uno opcional. La tentación es pedir correo,
 * ciudad, presupuesto y cuántos seguidores tiene — y cada campo extra en
 * un formulario que vive detrás de anuncios pagados cuesta prospectos.
 * Estos cinco alcanzan para generarle tres piezas y devolverle la llamada,
 * que es todo lo que la página promete.
 *
 * No pide correo a propósito: el canal es WhatsApp. Pedir las dos cosas
 * sugiere que vas a mandar boletines, y el correo no se usaría.
 */
export function LeadForm() {
  const parametros = useSearchParams();
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (listo) {
    return (
      <div className="rounded-3xl bg-[image:var(--plastico)] p-7 shadow-[var(--relieve-panel)] sm:p-8">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950">Quedó.</h2>
        <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-zinc-600">
          En menos de 24 horas te escribo por WhatsApp con tres piezas hechas para tu negocio. Si no
          te laten, ahí queda y no me debes nada.
        </p>
      </div>
    );
  }

  async function enviar(formulario: FormData) {
    setEnviando(true);
    setError(null);
    const resultado = await registrarProspecto({
      nombre: formulario.get("nombre"),
      negocio: formulario.get("negocio"),
      giro: formulario.get("giro"),
      whatsapp: formulario.get("whatsapp"),
      instagram: formulario.get("instagram") || undefined,
      // De qué anuncio vino, para poder separar el tráfico de cada
      // creatividad sin depender del pixel de Meta.
      origen: parametros.get("origen") ?? undefined,
    });
    setEnviando(false);
    if (resultado.success) setListo(true);
    else setError(resultado.error);
  }

  return (
    <form
      action={enviar}
      className="rounded-3xl bg-[image:var(--plastico)] p-6 shadow-[var(--relieve-panel)] sm:p-7"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="nombre">Tu nombre</Label>
          <Input id="nombre" name="nombre" required autoComplete="name" placeholder="Mauricio" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="negocio">Tu negocio</Label>
          <Input id="negocio" name="negocio" required placeholder="Estudio Vértice" />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="giro">¿A qué se dedica?</Label>
          <Select id="giro" name="giro" required defaultValue="">
            <option value="" disabled>
              Elige una opción
            </option>
            {GIROS_PROSPECTO.map((giro) => (
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
            placeholder="33 1234 5678"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="instagram">
            Tu Instagram <span className="font-normal text-zinc-400">(opcional)</span>
          </Label>
          <Input id="instagram" name="instagram" placeholder="@tunegocio" />
          <p className="text-xs leading-snug text-zinc-500">
            Si me lo pasas, la muestra sale más parecida a lo tuyo.
          </p>
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
          Sin costo y sin compromiso. Te escribo yo, no un robot.
        </p>
      </div>
    </form>
  );
}
