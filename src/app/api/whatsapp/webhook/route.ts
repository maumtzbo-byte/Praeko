import { NextResponse } from "next/server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { firmaValida, mensajesDelPayload } from "@/lib/whatsapp/webhook";

/**
 * El webhook de WhatsApp. SOLO LEE.
 *
 * No existe aquí ninguna llamada al endpoint de envío de Meta, y esa es la
 * definición completa de "solo lectura": en la API de WhatsApp, mandar un
 * mensaje es una petición que alguien tiene que escribir a propósito. No
 * hay un modo que apagar. Mientras este archivo no tenga un POST a
 * /messages, el agente no puede contestarle a nadie aunque quisiera.
 *
 * Lo que hace es guardar. El agente que convierte la conversación en
 * prospecto NO corre aquí: Meta espera un 200 rápido y reintenta si
 * tarda, así que meter un modelo adentro provocaría reintentos en cascada
 * y mensajes duplicados. Se corre desde /prospectos, sobre el hilo ya
 * completo, que además es cuando hay algo que extraer.
 */

// Node y no Edge: la verificación de firma usa node:crypto.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * El apretón de manos de Meta al dar de alta la URL.
 *
 * Meta manda un GET con un token que tú configuraste y un reto; hay que
 * devolver el reto EN CRUDO, sin JSON y sin comillas, o la suscripción no
 * se activa y el error que enseña no dice por qué.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const modo = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const reto = url.searchParams.get("hub.challenge");

  const esperado = process.env.WHATSAPP_VERIFY_TOKEN;
  // Sin la variable configurada no se verifica nada. Falla cerrado, igual
  // que `esOperador`: un despliegue al que se le olvidó la variable debe
  // negar el alta, no aceptar la de cualquiera.
  if (!esperado || modo !== "subscribe" || token !== esperado || !reto) {
    return new NextResponse("No", { status: 403 });
  }

  return new NextResponse(reto, {
    status: 200,
    headers: { "content-type": "text/plain" },
  });
}

export async function POST(request: Request) {
  const secreto = process.env.META_APP_SECRET;
  if (!secreto) {
    console.error("webhook de WhatsApp: falta META_APP_SECRET");
    return new NextResponse("No", { status: 403 });
  }

  // El cuerpo crudo, antes de parsear. Volver a serializar el JSON cambia
  // espacios y escapes Unicode y la firma deja de coincidir.
  const crudo = await request.text();

  if (!firmaValida(crudo, request.headers.get("x-hub-signature-256"), secreto)) {
    console.warn("webhook de WhatsApp: firma inválida");
    return new NextResponse("No", { status: 403 });
  }

  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(crudo);
  } catch {
    // 200 y no 400: un payload que no se pudo leer no mejora reintentando,
    // y los reintentos en ciclo terminan con Meta desactivando la
    // suscripción entera.
    return NextResponse.json({ ok: true });
  }

  const mensajes = mensajesDelPayload(cuerpo);
  if (mensajes.length === 0) return NextResponse.json({ ok: true });

  const { error } = await createServiceRoleClient()
    .from("whatsapp_messages")
    .upsert(
      mensajes.map((m) => ({
        wam_id: m.wamId,
        wa_id: m.waId,
        telefono: m.telefono,
        nombre_perfil: m.nombrePerfil,
        entrante: m.entrante,
        tipo: m.tipo,
        texto: m.texto,
        enviado_at: m.enviadoAt,
      })),
      // Meta reintenta: el mismo mensaje va a llegar dos veces. `upsert`
      // sobre el id de Meta convierte la segunda entrega en nada, en vez
      // de un renglón repetido que torcería el hilo que lee el agente.
      { onConflict: "wam_id", ignoreDuplicates: true },
    );

  if (error) {
    console.error("webhook de WhatsApp: no se pudo guardar", error);
    // Aquí SÍ conviene el error: la falla es nuestra y es transitoria, y
    // el reintento de Meta es justo lo que recupera el mensaje.
    return new NextResponse("Error", { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
