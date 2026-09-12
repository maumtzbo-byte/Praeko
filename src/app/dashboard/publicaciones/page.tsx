import { PageHeader } from "@/components/dashboard/page-header";
import { PublicationsView } from "@/components/content/publications-view";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient } from "@/lib/supabase/server";
import { isPublishablePlatform } from "@/lib/social";
import { fetchMediaUrlsByItemId } from "@/lib/content/media";
import { EnvioDeAprobacion, type ResumenDeLiga } from "@/components/dashboard/envio-de-aprobacion";
import { PublicarEnTanda, type PiezaPublicable } from "@/components/dashboard/publicar-en-tanda";

// publishContentNow (called from this page) polls Meta's Instagram container
// status inline before it can return — see waitForInstagramContainerReady in
// src/lib/social/meta.ts — which alone can take tens of seconds for real
// video. Without this, Vercel's default serverless function duration (10s
// on Hobby, 15s on Pro) would kill the action mid-poll on any video that
// isn't near-instant to process. 60s is the max Hobby allows and covers
// Pro's default with room to spare.
export const maxDuration = 60;

export default async function PublicacionesPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const [
    { data: calendarItems },
    { data: inFlightGenerations },
    { data: connections },
    { data: ligaMasReciente },
  ] = await Promise.all([
    supabase
      .from("content_calendar")
      .select("*")
      .eq("business_id", business.id)
      .order("scheduled_date", { ascending: true }),
    // Only queued/processing jobs matter here — completed/failed ones
    // already show up as the content_calendar row's own status.
    supabase
      .from("generations")
      .select("id, content_calendar_id")
      .eq("business_id", business.id)
      .in("job_status", ["queued", "processing"]),
    supabase
      .from("social_connections")
      .select("id, platform, external_account_name")
      .eq("business_id", business.id)
      .eq("status", "active"),
    // La última liga de aprobación que se le mandó al cliente. Solo la
    // más reciente: crear una nueva reemplaza a la anterior en la práctica
    // —es la que se acaba de pegar en el chat— y enseñar el historial
    // completo aquí sería ruido para una pantalla que ya está llena.
    supabase
      .from("approval_links")
      .select("token, desde, hasta, opened_at, completed_at")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const inFlightByItemId = new Map(
    (inFlightGenerations ?? [])
      .filter((g): g is typeof g & { content_calendar_id: string } => g.content_calendar_id !== null)
      .map((g) => [g.content_calendar_id, g.id]),
  );

  // Google Business Profile connections never belong in the "publish to"
  // list — it's a data source (reviews), not a channel Frames posts
  // content to (see isPublishablePlatform). Narrowed here, not just
  // filtered, so PublicationsList's icon map stays exhaustive over
  // instagram/facebook/tiktok without needing a Google icon it would
  // never actually render.
  const publishableConnections = (connections ?? []).filter(
    (c): c is typeof c & { platform: "instagram" | "facebook" | "tiktok" } => isPublishablePlatform(c.platform),
  );

  // La miniatura de cada pieza ya generada. Antes esta lista solo mostraba
  // un icono de "video" o "imagen" igual para todas, así que había que
  // abrir una por una para saber qué era cada cosa.
  const mediaByItemId = await fetchMediaUrlsByItemId(
    supabase,
    business.id,
    (calendarItems ?? []).map((item) => item.id),
  );

  // El resumen de lo que el cliente contestó, calculado sobre el rango de
  // la liga y no sobre todo el calendario: una pieza de otro mes con
  // cambios pedidos no pertenece a esta revisión.
  //
  // Se calcula aquí, con las piezas que ya se trajeron, en vez de con
  // consultas de conteo aparte — son tres números sobre una lista que ya
  // está en memoria.
  const resumenDeLiga: ResumenDeLiga | null = ligaMasReciente
    ? (() => {
        const delMes = (calendarItems ?? []).filter(
          (item) =>
            item.scheduled_date >= ligaMasReciente.desde && item.scheduled_date <= ligaMasReciente.hasta,
        );
        return {
          token: ligaMasReciente.token,
          desde: ligaMasReciente.desde,
          abierta: Boolean(ligaMasReciente.opened_at),
          cerrada: Boolean(ligaMasReciente.completed_at),
          total: delMes.length,
          aprobadas: delMes.filter((i) => i.client_verdict === "aprobado").length,
          conCambios: delMes.filter((i) => i.client_verdict === "cambios").length,
          cambiosPedidos: delMes
            .filter((i) => i.client_verdict === "cambios" && i.client_feedback)
            .map((i) => ({ titulo: i.topic, comentario: i.client_feedback! })),
        };
      })()
    : null;

  // Lo que ya tiene archivo y todavía no sale. `status === "generada"` es
  // la única condición dura: sin archivo no hay nada que publicar. El
  // veredicto del cliente viaja aparte para que el componente decida qué
  // ofrecer marcado, qué apagado y qué ni enseñar.
  const publicables: PiezaPublicable[] = (calendarItems ?? [])
    .filter((item) => item.status === "generada")
    .map((item) => ({
      id: item.id,
      titulo: item.topic,
      fecha: item.scheduled_date,
      veredicto: item.client_verdict,
    }));

  return (
    <div>
      <PageHeader title="Publicaciones" description="Genera, revisa y publica tu contenido — en lista o por fecha." />
      <EnvioDeAprobacion resumen={resumenDeLiga} />
      <PublicarEnTanda
        piezas={publicables}
        cuentas={publishableConnections.map((c) => ({
          id: c.id,
          plataforma: c.platform,
          nombre: c.external_account_name,
        }))}
      />
      <PublicationsView
        businessId={business.id}
        initialItems={calendarItems ?? []}
        inFlightByItemId={inFlightByItemId}
        connections={publishableConnections}
        mediaByItemId={mediaByItemId}
      />
    </div>
  );
}
