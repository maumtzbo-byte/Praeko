import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { esOperador } from "@/lib/operacion/acceso";
import { ligaAlProspecto, esEstado, type Estado } from "@/lib/operacion/prospectos";
import { estilosPara, tituloDeEstilo } from "@/lib/marketing/estilos";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ListaDeProspectos, type Prospecto } from "@/components/operacion/lista-de-prospectos";
import { ImportarConversacion } from "@/components/operacion/importar-conversacion";

/** Es una pantalla interna. Que no la indexe nadie ni salga en un
 *  buscador, aunque el acceso ya esté cerrado: una URL interna que aparece
 *  en Google es una invitación a que la toquen. */
export const metadata: Metadata = {
  title: "Prospectos",
  robots: { index: false, follow: false },
};

/**
 * Se rinde por petición, siempre.
 *
 * Sin esto Next la prerrenderiza al compilar, y ahí pasa algo que no se ve
 * hasta producción: al compilar no existe ADMIN_EMAILS, así que `esOperador`
 * corta antes de tocar las cookies, la página llama a `notFound()` y ese 404
 * queda horneado como archivo estático. La pantalla nunca volvería a
 * renderizarse, ni con la sesión correcta.
 *
 * El resto del panel es dinámico por accidente —lee cookies sin condición y
 * eso basta para que Next lo marque así—. Aquí el corto circuito de
 * `esOperador` evita justo esa lectura, o sea que la protección accidental no
 * aplica y hay que pedirla.
 */
export const dynamic = "force-dynamic";

/** El tope de Vercel en el plan Hobby. Lo pide `importarConversacion`, que
 *  espera a un modelo; con los 10 s de omisión se cortaría a medio camino. */
export const maxDuration = 60;

/** Tope de filas. Con el volumen de hoy no se alcanza nunca, y existe para
 *  que el día que sí haya mil prospectos la pantalla no intente firmar mil
 *  URLs de fotos en una sola petición. Cuando llegue ese día, hace falta
 *  paginar de verdad. */
const TOPE = 200;

const FIRMA_VIGENTE_S = 3600;

/** Cuántos días lleva el prospecto esperando.
 *
 *  Va en una función y no dentro del componente porque `Date.now()` en el
 *  cuerpo de un render es impuro, y el compilador de React lo marca. */
function diasDesde(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

const FECHA = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Monterrey",
});

export default async function ProspectosPage() {
  // 404 y no 403: un "no tienes permiso" confirma que la pantalla existe.
  if (!(await esOperador())) notFound();

  const supabase = createServiceRoleClient();

  const { data: filas, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(TOPE);

  if (error) {
    console.error("No se pudieron leer los prospectos", error);
    return (
      <main className="mx-auto w-full max-w-3xl px-5 py-16">
        <h1 className="text-2xl font-semibold text-zinc-900">Prospectos</h1>
        <p className="mt-3 text-sm text-zinc-600">
          No se pudo leer la base. Revisa la conexión y vuelve a cargar.
        </p>
      </main>
    );
  }

  const leads = filas ?? [];

  // Una sola firma para todas las fotos de todos los prospectos en vez de
  // una llamada por prospecto: con veinte prospectos de cuatro fotos, lo
  // segundo son veinte viajes a Storage antes de pintar nada.
  const rutas = leads.flatMap((lead) => lead.fotos);
  const urlPorRuta = new Map<string, string>();
  if (rutas.length > 0) {
    const { data: firmadas } = await supabase.storage
      .from("fotos-prospecto")
      .createSignedUrls(rutas, FIRMA_VIGENTE_S);
    for (const firma of firmadas ?? []) {
      if (firma.path && firma.signedUrl) urlPorRuta.set(firma.path, firma.signedUrl);
    }
  }

  const prospectos: Prospecto[] = leads.map((lead) => {
    const catalogo = estilosPara(lead.giro);
    return {
      id: lead.id,
      nombre: lead.nombre,
      negocio: lead.negocio,
      giro: lead.giro,
      whatsapp: lead.whatsapp,
      ligaWhatsapp: ligaAlProspecto(lead.whatsapp, lead.nombre, lead.negocio),
      instagram: lead.instagram,
      sitioWeb: lead.sitio_web,
      ciudad: lead.ciudad,
      vende: lead.vende,
      preguntan: lead.preguntan,
      // Se traducen los ids a su título aquí, del lado del servidor: el
      // catálogo trae las cinco instrucciones del generador y no hay razón
      // para mandarlas al navegador.
      estilos: lead.estilos.flatMap((id) => {
        const estilo = catalogo.find((e) => e.id === id);
        return estilo ? [tituloDeEstilo(estilo)] : [];
      }),
      fotos: lead.fotos.flatMap((ruta) => {
        const url = urlPorRuta.get(ruta);
        return url ? [url] : [];
      }),
      estado: esEstado(lead.estado) ? lead.estado : ("nuevo" as Estado),
      notas: lead.notas,
      origen: lead.origen,
      cuando: FECHA.format(new Date(lead.created_at)),
      dias: diasDesde(lead.created_at),
    };
  });

  return (
    <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
        Prospectos
      </h1>
      <p className="mt-2 text-sm text-zinc-600">
        Todo lo que llega por /prueba. {prospectos.length}{" "}
        {prospectos.length === 1 ? "registro" : "registros"}.
      </p>

      <div className="mt-8">
        <ImportarConversacion />
      </div>

      <div className="mt-6">
        <ListaDeProspectos prospectos={prospectos} />
      </div>
    </main>
  );
}
