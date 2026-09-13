"use client";

import { useState, useTransition } from "react";
import { Download, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { generarMuestra, revisarMuestra } from "@/app/prospectos/muestra-actions";
import { pedirSubidaDeFoto, registrarFoto } from "@/app/prueba/actions";
import { createClient } from "@/lib/supabase/client";
import { TIPOS_DE_FOTO, TOPE_FOTOS } from "@/lib/validation/lead";

export type MuestraDelProspecto = {
  id: string;
  estado: string;
  url: string | null;
  costoUsd: number;
};

/**
 * Hacerle una pieza con SU producto, para mandársela por mensaje.
 *
 * Es el movimiento que cambia el primer contacto: "agarré una foto de tu
 * feed e hice esto" trae respuesta y "hola, ofrecemos marketing con IA" no.
 *
 * Vive dentro de la tarjeta del prospecto porque ahí está todo lo que
 * necesita —la categoría, el estilo que eligió, sus fotos— y sacarlo a otra
 * pantalla obligaría a cargarlo dos veces.
 */
export function PanelDeMuestra({
  leadId,
  fotos,
  muestras,
}: {
  leadId: string;
  /** URLs firmadas de las fotos que ya tiene. */
  fotos: string[];
  muestras: MuestraDelProspecto[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [enCurso, setEnCurso] = useState<MuestraDelProspecto | null>(
    muestras.find((m) => m.estado === "queued" || m.estado === "processing") ?? null,
  );
  const [lista, setLista] = useState<MuestraDelProspecto | null>(
    muestras.find((m) => m.estado === "completed" && m.url) ?? null,
  );
  const [generando, empezarGeneracion] = useTransition();
  const [revisando, empezarRevision] = useTransition();

  async function subir(archivos: FileList | null) {
    if (!archivos?.length) return;
    setError(null);
    setSubiendo(true);

    try {
      const supabase = createClient();
      for (const archivo of Array.from(archivos).slice(0, TOPE_FOTOS - fotos.length)) {
        if (!(TIPOS_DE_FOTO as readonly string[]).includes(archivo.type)) {
          setError("Solo JPG, PNG o WEBP.");
          continue;
        }
        const permiso = await pedirSubidaDeFoto({ leadId, tipo: archivo.type });
        if (!permiso.success) {
          setError(permiso.error);
          continue;
        }
        // El archivo viaja directo a Supabase y no por la server action: el
        // cuerpo de una server action topa en 1 MB y una foto de celular
        // pesa dos o tres.
        const { error: errorSubida } = await supabase.storage
          .from("fotos-prospecto")
          .uploadToSignedUrl(permiso.ruta, permiso.token, archivo);
        if (errorSubida) {
          setError("No se pudo subir la foto.");
          continue;
        }
        await registrarFoto({ leadId, ruta: permiso.ruta });
      }
      // Recargar para que las fotos nuevas lleguen firmadas del servidor.
      window.location.reload();
    } finally {
      setSubiendo(false);
    }
  }

  function generar() {
    setError(null);
    empezarGeneracion(async () => {
      const r = await generarMuestra({ leadId });
      if (r.success) {
        setEnCurso({ id: r.data.muestraId, estado: "queued", url: null, costoUsd: 0 });
      } else {
        setError(r.error);
      }
    });
  }

  function revisar() {
    if (!enCurso) return;
    setError(null);
    empezarRevision(async () => {
      const r = await revisarMuestra({ muestraId: enCurso.id });
      if (!r.success) {
        setError(r.error);
        return;
      }
      if (r.data.estado === "completed" && r.data.url) {
        setLista({ id: enCurso.id, estado: "completed", url: r.data.url, costoUsd: 0 });
        setEnCurso(null);
      } else if (r.data.estado === "failed") {
        setError("La generación falló. Vuelve a intentar.");
        setEnCurso(null);
      } else {
        setEnCurso({ ...enCurso, estado: r.data.estado });
      }
    });
  }

  return (
    <div className="mt-5 border-t border-zinc-100 pt-5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
        Muestra con su producto
      </p>

      {fotos.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-600">
          Sube una foto de su producto —de su propio feed— para poder generarle algo.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {fotos.map((url) => (
            <span
              key={url}
              className="h-14 w-14 overflow-hidden rounded-lg bg-zinc-100 shadow-[var(--relieve-hundido)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {fotos.length < TOPE_FOTOS && (
          <label className="cursor-pointer rounded-full bg-[image:var(--plastico)] px-3.5 py-2 text-xs font-medium text-zinc-700 shadow-[var(--relieve-pieza)] transition-all hover:brightness-[1.02] active:translate-y-px">
            {subiendo ? "Subiendo…" : "Subir foto"}
            <input
              type="file"
              accept={TIPOS_DE_FOTO.join(",")}
              multiple
              className="sr-only"
              disabled={subiendo}
              onChange={(e) => subir(e.target.files)}
            />
          </label>
        )}

        {fotos.length > 0 && !enCurso && !lista && (
          <Button size="sm" onClick={generar} loading={generando}>
            <Sparkles className="h-4 w-4" strokeWidth={1.75} />
            Generar muestra
          </Button>
        )}

        {enCurso && (
          <Button size="sm" variant="secondary" onClick={revisar} loading={revisando}>
            Ver si ya salió
          </Button>
        )}
      </div>

      {enCurso && !revisando && (
        <p className="mt-2 text-xs text-zinc-500">
          Generando. Tarda un par de minutos — dale a «ver si ya salió».
        </p>
      )}

      {lista?.url && (
        <div className="mt-3">
          <video
            src={lista.url}
            controls
            playsInline
            className="w-full max-w-xs rounded-xl bg-zinc-900 shadow-[var(--relieve-hundido)]"
          />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {/* La URL de fal.ai caduca, así que descargarla no es un extra:
                es la única forma de conservar la muestra. */}
            <a
              href={lista.url}
              download
              className="inline-flex items-center gap-1.5 text-sm text-accent underline underline-offset-2"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar para mandarla
            </a>
            <Button size="sm" variant="ghost" onClick={() => setLista(null)}>
              Generar otra
            </Button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
