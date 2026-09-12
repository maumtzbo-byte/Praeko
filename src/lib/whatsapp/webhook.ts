import { createHmac, timingSafeEqual } from "node:crypto";

import { normalizaWhatsapp } from "@/lib/validation/lead";

/**
 * Verifica que el webhook lo mandó Meta y no cualquiera que descubrió la
 * URL.
 *
 * El cuerpo tiene que ser el CRUDO, byte por byte, tal como llegó. Si se
 * parsea a JSON y se vuelve a serializar, la firma deja de coincidir por
 * diferencias de espacios y de escapes Unicode — y lo peor es que el
 * síntoma es "todo rechazado", que se confunde con una llave mal puesta.
 *
 * Sin esto, el endpoint es una puerta abierta: cualquiera que sepa la URL
 * puede inyectar conversaciones falsas y ensuciar el embudo. La URL no es
 * un secreto.
 */
export function firmaValida(crudo: string, encabezado: string | null, secreto: string): boolean {
  if (!encabezado?.startsWith("sha256=")) return false;

  const hex = encabezado.slice("sha256=".length);
  if (!/^[0-9a-f]+$/i.test(hex)) return false;

  const recibida = Buffer.from(hex, "hex");
  const esperada = createHmac("sha256", secreto).update(crudo, "utf8").digest();

  // timingSafeEqual truena si los largos difieren, así que se compara
  // antes. Y la comparación es de tiempo constante a propósito: un `===`
  // deja medir cuántos bytes coincidieron y armar la firma a ciegas.
  if (recibida.length !== esperada.length) return false;
  return timingSafeEqual(recibida, esperada);
}

/** Un mensaje ya normalizado, listo para guardar. */
export type MensajeEntrante = {
  wamId: string;
  waId: string;
  telefono: string;
  nombrePerfil: string | null;
  entrante: boolean;
  tipo: string;
  texto: string | null;
  enviadoAt: string;
};

/** Lo que hay dentro de un mensaje de Meta, de lo que aquí se usa. */
type MensajeCrudo = {
  id?: unknown;
  from?: unknown;
  to?: unknown;
  timestamp?: unknown;
  type?: unknown;
  text?: { body?: unknown };
};

function comoTexto(valor: unknown): string | null {
  return typeof valor === "string" && valor.trim().length > 0 ? valor.trim() : null;
}

/**
 * Saca los mensajes de un payload de Meta.
 *
 * Se leen tres campos distintos del mismo webhook:
 *  · `messages`           — lo que te escribió el prospecto;
 *  · `smb_message_echoes` — lo que TÚ contestaste desde la app del
 *    celular, que Coexistence copia para acá. Sin esto el hilo queda
 *    manco: se leerían sus preguntas sin tus respuestas.
 *  · `statuses`           — se ignora. Son acuses de entregado y leído, y
 *    no dicen nada de la conversación.
 *
 * Nunca lanza. Un payload con una forma que no se esperaba devuelve lista
 * vacía y el webhook contesta 200: si contestara error, Meta reintentaría
 * el mismo payload roto en ciclos hasta desactivar la suscripción.
 */
export function mensajesDelPayload(cuerpo: unknown): MensajeEntrante[] {
  const salida: MensajeEntrante[] = [];

  const raiz = cuerpo as { entry?: unknown };
  if (!Array.isArray(raiz?.entry)) return salida;

  for (const entrada of raiz.entry) {
    const cambios = (entrada as { changes?: unknown })?.changes;
    if (!Array.isArray(cambios)) continue;

    for (const cambio of cambios) {
      const { field, value } = (cambio ?? {}) as { field?: unknown; value?: unknown };
      const esEco = field === "smb_message_echoes";
      if (field !== "messages" && !esEco) continue;

      const valor = (value ?? {}) as {
        contacts?: unknown;
        messages?: unknown;
        message_echoes?: unknown;
      };

      // El nombre viene una vez por cambio, en `contacts`, no en cada
      // mensaje.
      const contacto = Array.isArray(valor.contacts) ? valor.contacts[0] : null;
      const nombrePerfil = comoTexto(
        (contacto as { profile?: { name?: unknown } })?.profile?.name,
      );

      // Los ecos llegan en `message_echoes` en unas versiones y en
      // `messages` en otras. Se aceptan las dos: adivinar mal aquí no da
      // error, da silencio.
      const lista = Array.isArray(valor.message_echoes)
        ? valor.message_echoes
        : Array.isArray(valor.messages)
          ? valor.messages
          : [];

      for (const crudo of lista as MensajeCrudo[]) {
        const wamId = comoTexto(crudo?.id);
        // En un eco, `from` es tu número y el del prospecto va en `to`.
        const waId = comoTexto(esEco ? crudo?.to : crudo?.from);
        if (!wamId || !waId) continue;

        const telefono = normalizaWhatsapp(waId);
        if (telefono.length !== 10) continue;

        const segundos = Number(crudo?.timestamp);
        const enviadoAt = Number.isFinite(segundos)
          ? new Date(segundos * 1000).toISOString()
          : new Date().toISOString();

        salida.push({
          wamId,
          waId,
          telefono,
          nombrePerfil: esEco ? null : nombrePerfil,
          entrante: !esEco,
          tipo: comoTexto(crudo?.type) ?? "desconocido",
          texto: comoTexto(crudo?.text?.body),
          enviadoAt,
        });
      }
    }
  }

  return salida;
}
