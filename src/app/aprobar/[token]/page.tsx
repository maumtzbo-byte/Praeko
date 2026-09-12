import type { Metadata } from "next";

import { FramesMark } from "@/components/brand/FramesMark";
import { RevisionDelMes, type PiezaParaRevisar } from "@/components/aprobacion/revision-del-mes";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { fetchMediaUrlsByItemId } from "@/lib/content/media";
import { estadoDeLiga, mesEnPalabras } from "@/lib/aprobacion/liga";

/**
 * La página donde el cliente aprueba su mes, sin cuenta y sin contraseña.
 *
 * Es la única pantalla del producto que vive fuera de la sesión, y por eso
 * todo lo de aquí se resuelve desde el token: el negocio, el rango de
 * fechas y las piezas. Nada se recibe por parámetro de consulta.
 *
 * Sin menú y sin enlaces a otra parte, por la misma razón que /prueba: la
 * página tiene un solo trabajo. Un cliente que se va a la portada a media
 * revisión es una revisión que no termina, y una revisión que no termina
 * es un mes que no se publica.
 */
export const metadata: Metadata = {
  title: "Tu mes de contenido | Frames",
  // Una liga con token en la URL jamás debe acabar en un buscador.
  robots: { index: false, follow: false, nocache: true },
};

// La liga es un secreto que vive en un chat: si alguien la reenvía, lo que
// se ve tiene que ser lo de hoy, no una copia guardada en una caché
// intermedia. Y el cliente que aprueba una pieza necesita ver su propio
// veredicto al recargar.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <FramesMark className="h-6 w-6 text-zinc-950" />
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{titulo}</h1>
      <p className="text-[15px] leading-relaxed text-zinc-600">{texto}</p>
    </div>
  );
}

export default async function AprobarPage({ params }: Params) {
  const { token } = await params;
  const serviceRole = createServiceRoleClient();

  const { data: liga } = await serviceRole
    .from("approval_links")
    .select("id, business_id, desde, hasta, expires_at, completed_at")
    .eq("token", token)
    .maybeSingle();

  // La caducidad se resuelve en `estadoDeLiga` y no aquí con `Date.now()`
  // a propósito: leer el reloj dentro del cuerpo de un componente es una
  // función impura en render, y el compilador de React lo marca como
  // error. Además deja la regla en un solo lugar, que es donde tiene que
  // estar — la misma la usa la server action.
  const estado = estadoDeLiga(liga);

  if (estado === "inexistente") {
    return (
      <Aviso
        titulo="Esta liga no existe"
        texto="Puede que esté incompleta si la copiaste a mano. Pídenos que te la mandemos de nuevo."
      />
    );
  }

  if (estado === "caducada") {
    return (
      <Aviso
        titulo="Esta liga ya caducó"
        texto="Las ligas duran 30 días por seguridad. Escríbenos y te mandamos una nueva en un minuto."
      />
    );
  }

  // A partir de aquí la liga es válida; TypeScript ya lo sabe porque
  // "inexistente" es el único caso con `liga` en null.
  if (!liga) return null;

  const [{ data: negocio }, { data: piezas }] = await Promise.all([
    serviceRole.from("businesses").select("name").eq("id", liga.business_id).maybeSingle(),
    serviceRole
      .from("content_calendar")
      .select(
        "id, scheduled_date, content_kind, format, topic, script, client_verdict, client_feedback",
      )
      .eq("business_id", liga.business_id)
      .gte("scheduled_date", liga.desde)
      .lte("scheduled_date", liga.hasta)
      .order("scheduled_date", { ascending: true }),
  ]);

  const lista = piezas ?? [];

  if (lista.length === 0) {
    return (
      <Aviso
        titulo="Todavía no hay nada que ver"
        texto="Tu mes está en producción. En cuanto esté listo te avisamos por WhatsApp y esta misma liga te lo va a mostrar."
      />
    );
  }

  const medios = await fetchMediaUrlsByItemId(
    serviceRole,
    liga.business_id,
    lista.map((p) => p.id),
  );

  const paraRevisar: PiezaParaRevisar[] = lista.map((p) => ({
    id: p.id,
    fecha: p.scheduled_date,
    tipo: p.content_kind,
    formato: p.format,
    titulo: p.topic,
    guion: p.script,
    veredicto: p.client_verdict,
    comentario: p.client_feedback,
    medio: medios.get(p.id) ?? null,
  }));

  return (
    <RevisionDelMes
      token={token}
      marca={negocio?.name ?? "tu marca"}
      mes={mesEnPalabras(liga.desde)}
      piezas={paraRevisar}
      yaCerrada={Boolean(liga.completed_at)}
    />
  );
}
