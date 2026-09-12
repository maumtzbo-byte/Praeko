import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { esOperador } from "@/lib/operacion/acceso";
import { ligaAlProspecto, esEstado, type Estado } from "@/lib/operacion/prospectos";
import { estilosPara, tituloDeEstilo } from "@/lib/marketing/estilos";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ListaDeProspectos, type Prospecto } from "@/components/operacion/lista-de-prospectos";
import { ImportarConversacion } from "@/components/operacion/importar-conversacion";
import {
  SalidasAWhatsapp,
  type ResumenDeSalidas,
} from "@/components/operacion/salidas-a-whatsapp";
import {
  ConversacionesSinProspecto,
  type HiloSinProspecto,
} from "@/components/operacion/conversaciones-sin-prospecto";

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

/** El día local en Monterrey, como "2026-09-12".
 *
 *  Se compara la fecha YA FORMATEADA en vez de hacer aritmética con el
 *  desfase horario. México no cambia de horario desde 2022, así que restar
 *  seis horas funcionaría hoy — y sería una bomba de tiempo escrita a
 *  mano el día que eso cambie o que se agregue otra zona. */
const DIA_LOCAL = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Monterrey" });

const SALIDAS_DIAS = 7;

/** El inicio de la ventana de salidas. En función y no en línea porque
 *  `Date.now()` en el cuerpo de un render es impuro y el compilador de
 *  React lo marca — el mismo motivo que `diasDesde`. */
function inicioDeVentana(): string {
  return new Date(Date.now() - SALIDAS_DIAS * 86_400_000).toISOString();
}

/** Cuenta las salidas al WhatsApp de los últimos 7 días. */
function resumirSalidas(filas: { origen: string | null; created_at: string }[]): ResumenDeSalidas {
  const hoyLocal = DIA_LOCAL.format(new Date());

  let hoy = 0;
  const porOrigen = new Map<string, number>();

  for (const fila of filas) {
    if (DIA_LOCAL.format(new Date(fila.created_at)) === hoyLocal) hoy += 1;
    // Sin `origen` es tráfico directo, y contarlo como un origen llamado
    // "directo" lo mezclaría con un anuncio que de verdad se llamara así.
    if (fila.origen) porOrigen.set(fila.origen, (porOrigen.get(fila.origen) ?? 0) + 1);
  }

  return {
    hoy,
    semana: filas.length,
    porOrigen: [...porOrigen.entries()]
      .map(([origen, cuantos]) => ({ origen, cuantos }))
      .sort((a, b) => b.cuantos - a.cuantos),
  };
}

/** Cuántos mensajes se traen para armar la bandeja. No es el hilo
 *  completo — eso lo lee `importarHilo` cuando hace falta—, solo lo
 *  suficiente para saber quién escribió y qué dijo al final. */
const TOPE_MENSAJES = 400;

type MensajeDeBandeja = {
  telefono: string;
  nombre_perfil: string | null;
  texto: string | null;
  tipo: string;
  entrante: boolean;
  enviado_at: string;
};

/**
 * Agrupa los mensajes por teléfono y deja fuera a los que ya son
 * prospecto.
 *
 * El cruce se hace aquí y no en SQL porque `leads` y `whatsapp_messages`
 * no tienen llave foránea entre ellas: se juntan por un teléfono
 * normalizado que las dos guardan por su cuenta. Con el volumen de esta
 * pantalla, traer los dos lados y cruzarlos en memoria cuesta menos que
 * una vista.
 */
function armarBandeja(
  mensajes: MensajeDeBandeja[],
  telefonosConProspecto: Set<string>,
): HiloSinProspecto[] {
  const porTelefono = new Map<string, MensajeDeBandeja[]>();
  for (const m of mensajes) {
    if (telefonosConProspecto.has(m.telefono)) continue;
    const hilo = porTelefono.get(m.telefono);
    if (hilo) hilo.push(m);
    else porTelefono.set(m.telefono, [m]);
  }

  return [...porTelefono.entries()]
    // Se ordena ANTES de pintar, por la fecha cruda. Ordenar después
    // usaría `ultimo`, que ya viene formateado como "12 sept", y eso
    // alfabéticamente pone octubre antes que septiembre.
    .sort(([, a], [, b]) => (a[0]!.enviado_at < b[0]!.enviado_at ? 1 : -1))
    .map(([telefono, hilo]) => {
      // Llegan del más nuevo al más viejo.
      const ultimoSuyo = hilo.find((m) => m.entrante) ?? hilo[0];
      return {
        telefono,
        nombrePerfil: hilo.find((m) => m.nombre_perfil)?.nombre_perfil ?? null,
        cuantos: hilo.length,
        ultimo: FECHA_CORTA.format(new Date(hilo[0]!.enviado_at)),
        vistazo: ultimoSuyo?.texto ?? `[${ultimoSuyo?.tipo ?? "sin texto"}]`,
      };
    });
}

const FECHA_CORTA = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: "America/Monterrey",
});

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

  const desde = inicioDeVentana();

  const [{ data: filas, error }, { data: salidas }, { data: mensajes }] = await Promise.all([
    supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(TOPE),
    // Las salidas no bloquean la pantalla: si la tabla todavía no existe
    // —la migración 0031 se corre aparte— esto devuelve error y el resumen
    // sale en cero, en vez de tumbar la lista de prospectos.
    supabase.from("whatsapp_exits").select("origen, created_at").gte("created_at", desde),
    supabase
      .from("whatsapp_messages")
      .select("telefono, nombre_perfil, texto, tipo, entrante, enviado_at")
      .order("enviado_at", { ascending: false })
      .limit(TOPE_MENSAJES),
  ]);

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

  // El cruce va contra TODOS los prospectos, no contra los que se pintan:
  // `leads` está topado a 200 y un prospecto más viejo que eso volvería a
  // aparecer en la bandeja como si nunca se hubiera atendido. Se pregunta
  // por los teléfonos exactos que salieron en los mensajes.
  const telefonosDeMensajes = [...new Set((mensajes ?? []).map((m) => m.telefono))];
  let conProspecto = new Set<string>();
  if (telefonosDeMensajes.length > 0) {
    const { data: yaSon } = await supabase
      .from("leads")
      .select("whatsapp")
      .in("whatsapp", telefonosDeMensajes);
    conProspecto = new Set((yaSon ?? []).map((l) => l.whatsapp));
  }
  const bandeja = armarBandeja(mensajes ?? [], conProspecto);

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

      <div className="mt-6">
        <SalidasAWhatsapp resumen={resumirSalidas(salidas ?? [])} />
      </div>

      <div className="mt-6">
        <ConversacionesSinProspecto hilos={bandeja} />
      </div>

      <div className="mt-6">
        <ImportarConversacion />
      </div>

      <div className="mt-6">
        <ListaDeProspectos prospectos={prospectos} />
      </div>
    </main>
  );
}
