"use client";

import { useState } from "react";
import { Bookmark, Heart, MessageCircle, Music2, Send, Share2, ThumbsUp } from "lucide-react";

import { PlasticPanel } from "@/components/dashboard/plastic-panel";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/dashboard/social-icons";
import type { SocialPlatform } from "@/lib/social";
import { primerCuadro } from "@/lib/content/media";

export type PiezaPrevia = {
  id: string;
  topic: string;
  script: string | null;
  contentKind: "imagen" | "video";
  mediaUrl: string | null;
  /** Solo existe una vez publicada. Antes de eso la red NO está decidida
   *  —se elige al momento de publicar, ver publishContentItem— así que
   *  mientras sea null el preview no puede afirmar ninguna. */
  publishedPlatform: SocialPlatform | null;
};

export type CuentaConectada = {
  platform: SocialPlatform;
  nombre: string;
  avatarUrl: string | null;
};

/**
 * Cómo se va a ver la pieza cuando salga.
 *
 * Es lo único de la pantalla que contesta "¿esto está bueno?" para alguien
 * que no sabe juzgar por una línea de texto — que es exactamente el
 * usuario de Frames. Un tema y una fecha no le dicen nada; la sudadera
 * verde con su copy debajo sí.
 *
 * Por qué es conmutable y no muestra una sola red: para una pieza que
 * todavía no sale, la red NO está decidida. Se elige al publicar
 * (publishContentItem recibe un connectionId), así que dibujar el marco de
 * Instagram y ya sería afirmar algo que el sistema no sabe. Conmutable es
 * a la vez más honesto y más útil: se ve cómo queda el mismo corte en cada
 * red, que es donde de verdad cambia (TikTok recorta a vertical completo,
 * Instagram no).
 *
 * Una pieza ya publicada sí sabe dónde salió, así que ahí el selector se
 * bloquea en su red real.
 */
const MARCA: Record<SocialPlatform, { nombre: string; Icono: typeof InstagramIcon | null }> = {
  instagram: { nombre: "Instagram", Icono: InstagramIcon },
  facebook: { nombre: "Facebook", Icono: FacebookIcon },
  tiktok: { nombre: "TikTok", Icono: TikTokIcon },
  // Google Business Profile es fuente de datos (reseñas), no un canal de
  // publicación — nunca llega aquí, pero el Record tiene que ser completo.
  google_business: { nombre: "Google", Icono: null },
};

function Medio({ pieza, alto }: { pieza: PiezaPrevia; alto: string }) {
  if (!pieza.mediaUrl) {
    return (
      <div className={`flex ${alto} items-center justify-center bg-zinc-100 px-6 text-center`}>
        <p className="text-xs leading-relaxed text-zinc-500">
          Todavía no se genera el archivo de esta pieza.
        </p>
      </div>
    );
  }
  if (pieza.contentKind === "video") {
    return (
      // `preload="metadata"` trae el primer cuadro y nada más: alcanza para
      // la vista previa y no descarga el video completo de cada pieza en
      // una pantalla que el dueño abre todos los días.
      <video
        src={primerCuadro(pieza.mediaUrl)}
        className={`${alto} w-full bg-zinc-900 object-cover`}
        preload="metadata"
        muted
        playsInline
        controls
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={pieza.mediaUrl} alt="" className={`${alto} w-full bg-zinc-100 object-cover`} />;
}

function Avatar({ cuenta }: { cuenta: CuentaConectada }) {
  if (cuenta.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={cuenta.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />;
  }
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-[11px] font-semibold text-zinc-600">
      {cuenta.nombre.replace("@", "").slice(0, 2).toUpperCase()}
    </span>
  );
}

export function PostPreview({
  pieza,
  cuentas,
  fechaLabel,
  className = "",
}: {
  pieza: PiezaPrevia | null;
  cuentas: CuentaConectada[];
  fechaLabel?: string | null;
  className?: string;
}) {
  const bloqueada = pieza?.publishedPlatform ?? null;
  const disponibles = bloqueada ? cuentas.filter((c) => c.platform === bloqueada) : cuentas;
  const [activa, setActiva] = useState<SocialPlatform | null>(bloqueada ?? cuentas[0]?.platform ?? null);
  const cuenta = disponibles.find((c) => c.platform === activa) ?? disponibles[0] ?? null;

  if (!pieza || !cuenta) {
    return (
      <PlasticPanel relieve="neutro" className={`p-5 sm:p-6 ${className}`}>
        <h2 className="text-[15px] font-semibold tracking-tight text-zinc-950">Vista previa</h2>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
          {!cuenta
            ? "Conecta una red social y aquí vas a ver cómo queda tu contenido antes de que salga."
            : "En cuanto se genere tu primera pieza, aquí la vas a ver tal como se va a publicar."}
        </p>
      </PlasticPanel>
    );
  }

  const pie = pieza.script ?? pieza.topic;

  return (
    <PlasticPanel relieve="neutro" className={`overflow-hidden ${className}`}>
      <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-[15px] font-semibold tracking-tight text-zinc-950">Vista previa</h2>
        {/* El selector solo aparece si hay de dónde escoger. Con una sola
            red conectada, o con la pieza ya publicada, un conmutador de un
            botón es ruido. */}
        {disponibles.length > 1 && (
          <div className="flex items-center gap-1">
            {disponibles.map(({ platform }) => {
              const { Icono, nombre } = MARCA[platform];
              const puesta = platform === cuenta.platform;
              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => setActiva(platform)}
                  aria-pressed={puesta}
                  aria-label={`Ver como ${nombre}`}
                  className={
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-all " +
                    (puesta
                      ? "bg-[image:var(--plastico-oscuro)] text-white shadow-[var(--relieve-oscuro)] "
                      : "bg-[image:var(--plastico)] text-zinc-500 shadow-[var(--relieve-pieza)] active:translate-y-px ")
                  }
                >
                  {Icono ? <Icono className="h-3.5 w-3.5" /> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {/* El marco imita la red pero no la copia pixel por pixel: es una
            referencia de encuadre y de largo de copy, no una simulación.
            Copiarla exacta invita a leerla como "así se ve ya publicado",
            y esto es un borrador. */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.07),0_10px_20px_-14px_rgba(15,23,42,0.35)]">
          {cuenta.platform === "tiktok" ? (
            <div className="relative">
              <Medio pieza={pieza} alto="h-[22rem]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10">
                <p className="text-[13px] font-semibold text-white">{cuenta.nombre}</p>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-white/90">{pie}</p>
                <p className="mt-1.5 flex items-center gap-1 text-[11px] text-white/70">
                  <Music2 className="h-3 w-3" /> Audio original
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <Avatar cuenta={cuenta} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-zinc-900">{cuenta.nombre}</p>
                  <p className="truncate text-[11px] text-zinc-500">
                    {MARCA[cuenta.platform].nombre}
                    {fechaLabel ? ` · ${fechaLabel}` : ""}
                  </p>
                </div>
              </div>

              <Medio pieza={pieza} alto="h-64" />

              {cuenta.platform === "instagram" ? (
                <div className="flex items-center gap-3.5 px-3 pb-1.5 pt-2.5 text-zinc-800">
                  <Heart className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  <Send className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  <Bookmark className="ml-auto h-[18px] w-[18px]" strokeWidth={1.75} />
                </div>
              ) : (
                <div className="flex items-center justify-around border-t border-zinc-100 px-3 py-2 text-[12px] font-medium text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <ThumbsUp className="h-4 w-4" strokeWidth={1.75} /> Me gusta
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="h-4 w-4" strokeWidth={1.75} /> Comentar
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Share2 className="h-4 w-4" strokeWidth={1.75} /> Compartir
                  </span>
                </div>
              )}

              <p className="line-clamp-3 px-3 pb-3 text-[12.5px] leading-snug text-zinc-700">{pie}</p>
            </>
          )}
        </div>

        {/* Se dice sin adornos: mientras la pieza no salga, la red es una
            simulación y no una promesa. */}
        <p className="mt-3 text-[11px] leading-snug text-zinc-400">
          {bloqueada
            ? `Publicada en ${MARCA[bloqueada].nombre}.`
            : "Simulación. La red se elige al momento de publicar."}
        </p>
      </div>
    </PlasticPanel>
  );
}
