import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { esOperador } from "@/lib/operacion/acceso";
import { evaluarRiesgo, type Riesgo } from "@/lib/operacion/riesgo";
import { ordenarPorDesempeno } from "@/lib/desempeno/historial";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ListaDeClientes, type ClienteEnLista } from "@/components/operacion/lista-de-clientes";

export const metadata: Metadata = { title: "Clientes", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** En días. Es la ventana de "últimamente" para publicaciones y mensajes. */
const VENTANA = 30;

/** El inicio de la ventana de "últimamente". En función y no en línea
 *  porque `Date.now()` en el cuerpo de un render es impuro y el compilador
 *  de React lo marca — igual que en /prospectos. */
function inicioDeVentana(): string {
  return new Date(Date.now() - VENTANA * 86_400_000).toISOString();
}

function diasDesde(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export default async function ClientesPage() {
  if (!(await esOperador())) notFound();

  const supabase = createServiceRoleClient();
  const desde = inicioDeVentana();

  const [{ data: negocios }, { data: suscripciones }, { data: ligas }, { data: piezas }, { data: mediciones }] =
    await Promise.all([
      supabase.from("businesses").select("id, name, industry, phone, created_at"),
      supabase
        .from("subscriptions")
        .select("business_id, plan_key, status, agregado_comentarios, agregado_comentarios_precio, primer_agregado_at"),
      supabase
        .from("approval_links")
        .select("business_id, opened_at, completed_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("content_calendar")
        .select("id, business_id, topic, format, content_kind, status, published_at"),
      supabase
        .from("post_insights")
        .select("business_id, content_calendar_id, impressions, likes, comments, shares, horas_publicada, medido_at"),
    ]);

  const { data: metas } = await supabase
    .from("metas")
    .select("id, business_id, texto, para_fecha, cumplida_at")
    .order("created_at", { ascending: false });

  // Los mensajes de WhatsApp se juntan por teléfono, no por negocio: la
  // tabla de mensajes no sabe de negocios, sabe de números.
  const { data: mensajes } = await supabase
    .from("whatsapp_messages")
    .select("telefono, enviado_at")
    .eq("entrante", true)
    .order("enviado_at", { ascending: false })
    .limit(500);

  const ultimoMensajePorTelefono = new Map<string, string>();
  for (const m of mensajes ?? []) {
    if (!ultimoMensajePorTelefono.has(m.telefono)) {
      ultimoMensajePorTelefono.set(m.telefono, m.enviado_at);
    }
  }

  const clientes: ClienteEnLista[] = (negocios ?? []).map((negocio) => {
    const suscripcion = suscripciones?.find((s) => s.business_id === negocio.id) ?? null;
    const susLigas = (ligas ?? []).filter((l) => l.business_id === negocio.id);
    const susPiezas = (piezas ?? []).filter((p) => p.business_id === negocio.id);
    const susMediciones = (mediciones ?? []).filter((m) => m.business_id === negocio.id);

    const publicadas = susPiezas.filter(
      (p) => p.status === "publicada" && p.published_at && p.published_at >= desde,
    );

    // El teléfono del negocio viene con el formato que haya; se comparan
    // solo los últimos 10 dígitos, que es lo que guarda whatsapp_messages.
    const digitos = (negocio.phone ?? "").replace(/\D/g, "").slice(-10);
    const ultimoMensaje = digitos ? (ultimoMensajePorTelefono.get(digitos) ?? null) : null;

    const medidas = ordenarPorDesempeno(
      susPiezas
        .filter((p) => p.status === "publicada")
        .map((p) => ({
          id: p.id,
          topic: p.topic,
          format: p.format,
          content_kind: p.content_kind,
          published_at: p.published_at,
        })),
      susMediciones,
    );

    const riesgo: Riesgo = evaluarRiesgo({
      diasDeCliente: diasDesde(negocio.created_at) ?? 0,
      ligas: susLigas.map((l) => ({
        abierta: Boolean(l.opened_at),
        completada: Boolean(l.completed_at),
        diasDesde: diasDesde(l.created_at) ?? 0,
      })),
      diasSinEscribir: diasDesde(ultimoMensaje),
      publicadasUltimoMes: publicadas.length,
      tieneAgregado: Boolean(suscripcion?.agregado_comentarios),
      piezasMedidas: medidas.length,
    });

    return {
      id: negocio.id,
      nombre: negocio.name,
      giro: negocio.industry,
      telefono: negocio.phone,
      plan: suscripcion?.plan_key ?? null,
      estadoSuscripcion: suscripcion?.status ?? null,
      agregadoComentarios: Boolean(suscripcion?.agregado_comentarios),
      precioAgregado: suscripcion?.agregado_comentarios_precio ?? null,
      diasDeCliente: diasDesde(negocio.created_at) ?? 0,
      publicadasUltimoMes: publicadas.length,
      piezasMedidas: medidas.length,
      riesgo,
      metas: (metas ?? [])
        .filter((m) => m.business_id === negocio.id)
        .map((m) => ({
          id: m.id,
          texto: m.texto,
          paraFecha: m.para_fecha,
          cumplida: Boolean(m.cumplida_at),
          // El avance contra el objetivo se calculará cuando haya dos
          // mediciones que comparar; por ahora la meta vale por estar
          // escrita y acordada, que es de donde sale la retención.
          avance: null,
        })),
    };
  });

  // Los que más urgen, arriba. Es el único orden que sirve en una pantalla
  // que se abre para ver a quién hay que atender hoy.
  const orden: Record<Riesgo["nivel"], number> = { urgente: 0, ojo: 1, bien: 2 };
  clientes.sort((a, b) => orden[a.riesgo.nivel] - orden[b.riesgo.nivel]);

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">Clientes</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Los que más urgen primero. Las señales salen de datos que ya se guardaban: ligas sin
        abrir, silencio en WhatsApp, meses sin publicar.
      </p>

      <div className="mt-8">
        <ListaDeClientes clientes={clientes} />
      </div>
    </main>
  );
}
