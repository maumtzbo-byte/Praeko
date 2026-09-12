"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import { pedirSubidaDeFoto, registrarFoto } from "@/app/prueba/actions";
import { conLimite, mensajeDeEspera } from "@/lib/espera";
import { createClient } from "@/lib/supabase/client";
import { TIPOS_DE_FOTO, TOPE_FOTOS } from "@/lib/validation/lead";

/**
 * Las fotos del producto, subidas por alguien que no tiene cuenta.
 *
 * El archivo NO pasa por el servidor. Se pide una URL firmada a una server
 * action —que valida el prospecto y cuenta cuántas fotos lleva— y el
 * navegador sube directo a Supabase con ese permiso de un solo uso. Mandar
 * tres fotos de celular dentro de una server action serían doce megas de
 * cuerpo de petición contra un límite de uno.
 *
 * Cada foto se sube y se anota sola, en cuanto se elige. Nada de un botón
 * de "subir" al final: si el navegador se cierra a media tanda, lo que ya
 * subió ya quedó guardado.
 *
 * La miniatura sale de un blob local y no de volver a bajar el archivo:
 * la cubeta es privada, así que traer la imagen de regreso costaría otra
 * URL firmada por foto para enseñar algo que el navegador ya tiene en la
 * mano.
 */

type Foto = { id: string; url: string; estado: "subiendo" | "lista" | "falló" };

export function SubidaDeFotos({ leadId }: { leadId: string }) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  const listas = fotos.filter((f) => f.estado === "lista").length;
  const lleno = fotos.length >= TOPE_FOTOS;

  async function subir(archivo: File) {
    const id = crypto.randomUUID();
    const url = URL.createObjectURL(archivo);
    setFotos((previo) => [...previo, { id, url, estado: "subiendo" }]);

    const marcar = (estado: Foto["estado"]) =>
      setFotos((previo) => previo.map((f) => (f.id === id ? { ...f, estado } : f)));

    try {
      const permiso = await conLimite(pedirSubidaDeFoto({ leadId, tipo: archivo.type }));
      if (!permiso.success) {
        setError(permiso.error);
        marcar("falló");
        return;
      }

      const supabase = createClient();
      const { error: falla } = await conLimite(
        supabase.storage.from("fotos-prospecto").uploadToSignedUrl(permiso.ruta, permiso.token, archivo),
        // Más holgado que el resto: aquí de verdad viajan megabytes por una
        // red de celular, no una consulta de unos bytes.
        60_000,
      );

      if (falla) {
        // El tamaño lo rechaza la cubeta, no este código: una validación
        // en el navegador la brinca cualquiera con la consola abierta.
        setError(
          falla.message.toLowerCase().includes("size")
            ? "Esa foto pesa más de 10 MB. Mándala más chica."
            : "No se pudo subir. Revisa tu señal y vuelve a intentar.",
        );
        marcar("falló");
        return;
      }

      const anotada = await conLimite(registrarFoto({ leadId, ruta: permiso.ruta }));
      if (!anotada.success) {
        setError(anotada.error);
        marcar("falló");
        return;
      }

      marcar("lista");
    } catch (err) {
      setError(mensajeDeEspera(err, "Está tardando demasiado. Revisa tu señal y vuelve a intentar."));
      marcar("falló");
    }
  }

  function elegir(lista: FileList | null) {
    if (!lista) return;
    setError(null);
    const caben = TOPE_FOTOS - fotos.length;
    for (const archivo of Array.from(lista).slice(0, caben)) {
      if (!(TIPOS_DE_FOTO as readonly string[]).includes(archivo.type)) {
        setError("Solo aceptamos JPG, PNG o WEBP.");
        continue;
      }
      void subir(archivo);
    }
    if (entrada.current) entrada.current.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={entrada}
        type="file"
        accept={TIPOS_DE_FOTO.join(",")}
        multiple
        hidden
        onChange={(e) => elegir(e.target.files)}
      />

      <div className="flex flex-wrap gap-2">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            className="relative h-20 w-20 overflow-hidden rounded-xl bg-zinc-100 shadow-[var(--relieve-hundido)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foto.url}
              alt=""
              className={`h-full w-full object-cover transition-opacity ${
                foto.estado === "lista" ? "opacity-100" : "opacity-45"
              }`}
            />
            {foto.estado === "subiendo" && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-600" />
              </span>
            )}
            {foto.estado === "falló" && (
              <button
                type="button"
                onClick={() => setFotos((previo) => previo.filter((f) => f.id !== foto.id))}
                aria-label="Quitar la foto que falló"
                className="absolute inset-0 flex items-center justify-center bg-red-50/80 text-red-700"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        ))}

        {!lleno && (
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl bg-[image:var(--plastico)] text-zinc-600 shadow-[var(--relieve-pieza)] transition-all hover:brightness-[1.02] active:translate-y-px"
          >
            <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-[11px] font-medium">
              {fotos.length === 0 ? "Subir" : "Otra"}
            </span>
          </button>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-700">
          {error}
        </p>
      ) : (
        <p className="text-xs leading-snug text-zinc-500">
          {listas === 0
            ? "Las que ya tengas sirven, aunque sean de fondo blanco o de celular."
            : listas === 1
              ? "Con esa ya podemos. Si tienes otra de lado o de la etiqueta, mejor."
              : `${listas} fotos. Con eso sale bien.`}
        </p>
      )}
    </div>
  );
}
