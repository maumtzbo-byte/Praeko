import type Anthropic from "@anthropic-ai/sdk";

import { getClaudeClient } from "./claude-client";
import { CATEGORIAS_PRODUCTO } from "@/lib/validation/lead";

/**
 * Agente que saca un prospecto de una conversación de WhatsApp.
 *
 * Existe porque el embudo tiene dos entradas y solo una queda registrada.
 * Quien llena el formulario de /prueba cae en `leads` con todo su contexto.
 * Quien escribe directo al WhatsApp —desde el anuncio, desde el botón de la
 * landing, porque alguien le pasó el número— cuenta lo mismo o más, pero lo
 * cuenta en un chat, y ahí se queda.
 *
 * Este agente convierte eso en un prospecto. Hoy se le pega la conversación
 * a mano; mañana se la pasa el webhook de Coexistence. La pieza es la misma
 * y a propósito: el transporte cambia, la extracción no.
 *
 * La regla que manda sobre todas las demás es NO INVENTAR. Un prospecto con
 * un dato inventado es peor que un prospecto vacío: el campo `vende` es el
 * insumo con el que se producen las piezas de muestra, y una muestra hecha
 * sobre un producto que el cliente nunca mencionó se nota a la primera y
 * quema la venta.
 */

export type ProspectoExtraido = {
  nombre: string | null;
  negocio: string | null;
  giro: (typeof CATEGORIAS_PRODUCTO)[number] | null;
  whatsapp: string | null;
  instagram: string | null;
  sitioWeb: string | null;
  ciudad: string | null;
  vende: string | null;
  preguntan: string | null;
  /** Qué pasó en la conversación, para el campo de notas. */
  resumen: string;
  /** Dónde parece ir la conversación. Es una sugerencia: la mueve una
   *  persona, porque el agente no sabe lo que se habló por teléfono. */
  estadoSugerido: "nuevo" | "en_conversacion" | "cliente" | "perdido";
  /** Qué NO se pudo sacar y convendría preguntar. Va a la pantalla para
   *  que la siguiente respuesta del operador ya traiga las preguntas. */
  faltantes: string[];
};

const HERRAMIENTA = "registrar_prospecto";

const MODELO = "claude-sonnet-5";

function sistema(): string {
  return [
    "Eres el asistente de prospectos de Frames, una agencia de marketing con IA para marcas de producto empacado en México.",
    "Recibes una conversación de WhatsApp entre el equipo de Frames y una persona que pregunta por el servicio, y extraes los datos del prospecto.",
    "",
    "LA REGLA MÁS IMPORTANTE: no inventes nada. Si un dato no está dicho en la conversación, devuelve null. Nunca deduzcas, nunca completes, nunca rellenes con lo que sería razonable.",
    "Esto no es exageración: el campo 'vende' es el insumo con el que se producen las piezas de muestra del cliente. Un producto inventado se nota a la primera y tira la venta.",
    "",
    "Reglas por campo:",
    "- nombre: el de la persona, no el de la marca. Si solo firmó con su nombre de pila, ese basta.",
    "- negocio: el nombre de la marca. Si dice 'mi tiendita' sin nombrarla, es null.",
    "- giro: SOLO si queda claro de la lista. Ante la duda, null — la categoría equivocada manda a producir con referencias del nicho equivocado.",
    "- whatsapp: solo si aparece escrito en el texto. El número del que envía casi nunca está en el cuerpo del mensaje; si no lo ves escrito, es null.",
    "- instagram: sin arroba y sin URL, solo el usuario.",
    "- vende: qué producto quiere promocionar, en sus palabras. Copia lo que dijo, no lo resumas en una etiqueta.",
    "- preguntan: lo que sus clientes le preguntan a ÉL sobre su producto. No lo que él te preguntó a ti.",
    "- resumen: 1-3 frases de qué pasó y en qué quedaron. Escríbelo para alguien que va a retomar el chat en tres días y no se acuerda.",
    "- estadoSugerido: 'nuevo' si apenas escribió; 'en_conversacion' si ya hubo ida y vuelta; 'cliente' solo si aceptó explícitamente contratar o ya pagó; 'perdido' solo si dijo que no.",
    "- faltantes: los datos que hacen falta para producir una muestra y que no se dijeron. Escríbelos como la pregunta que habría que hacerle, en español y de tú.",
    "",
    "Todo en español de México. Responde únicamente llamando a la herramienta.",
  ].join("\n");
}

function esquema() {
  /** Un campo de texto que puede venir vacío.
   *
   *  Se escribe con `anyOf` y no con `type: ["string", "null"]`. El
   *  subconjunto de JSON Schema que acepta `strict: true` documenta
   *  `anyOf` como soportado y NO documenta los tipos en unión, así que la
   *  segunda forma se arriesga a un 400 de la API — un error que no se ve
   *  al compilar y aparece la primera vez que alguien importa un chat. */
  const opcional = (descripcion: string) => ({
    anyOf: [{ type: "string" as const }, { type: "null" as const }],
    description: `${descripcion} null si no se dijo en la conversación.`,
  });

  return {
    type: "object" as const,
    properties: {
      nombre: opcional("Nombre de la persona, no de la marca."),
      negocio: opcional("Nombre de la marca."),
      giro: {
        anyOf: [
          { type: "string" as const, enum: [...CATEGORIAS_PRODUCTO] },
          { type: "null" as const },
        ],
        description: "Categoría de producto, solo si queda clara. Ante la duda, null.",
      },
      whatsapp: opcional("Teléfono a 10 dígitos, solo si aparece escrito en el texto."),
      instagram: opcional("Usuario de Instagram, sin arroba ni URL."),
      sitioWeb: opcional("Dominio de su sitio."),
      ciudad: opcional("Ciudad donde opera."),
      vende: opcional("Qué producto quiere promocionar, en sus palabras."),
      preguntan: opcional("Qué le preguntan sus clientes sobre su producto."),
      resumen: {
        type: "string",
        description: "1-3 frases: qué pasó y en qué quedaron.",
      },
      estadoSugerido: {
        type: "string",
        enum: ["nuevo", "en_conversacion", "cliente", "perdido"],
      },
      faltantes: {
        type: "array",
        items: { type: "string" },
        description: "Lo que falta preguntarle, redactado como la pregunta misma.",
      },
    },
    required: [
      "nombre",
      "negocio",
      "giro",
      "whatsapp",
      "instagram",
      "sitioWeb",
      "ciudad",
      "vende",
      "preguntan",
      "resumen",
      "estadoSugerido",
      "faltantes",
    ],
    additionalProperties: false,
  };
}

/** Tope de texto que se le manda al modelo.
 *
 *  Una conversación de WhatsApp de meses exportada completa son cientos de
 *  miles de caracteres, y el prospecto está en las últimas. Se recorta por
 *  el FINAL y no por el principio: lo último que se dijo es lo que define
 *  en qué quedaron. */
const TOPE_CARACTERES = 24_000;

export async function extraerProspecto(conversacion: string): Promise<ProspectoExtraido> {
  const texto = conversacion.trim();
  if (texto.length === 0) {
    throw new Error("La conversación está vacía.");
  }

  const recortada =
    texto.length > TOPE_CARACTERES ? texto.slice(-TOPE_CARACTERES) : texto;

  const mensaje = await getClaudeClient().messages.create({
    model: MODELO,
    max_tokens: 2000,
    system: sistema(),
    messages: [
      {
        role: "user",
        content: `Conversación de WhatsApp:\n\n${recortada}`,
      },
    ],
    tools: [
      {
        name: HERRAMIENTA,
        description: "Registra los datos del prospecto que salen de la conversación.",
        input_schema: esquema(),
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: HERRAMIENTA },
  });

  const uso = mensaje.content.find(
    (bloque): bloque is Anthropic.ToolUseBlock => bloque.type === "tool_use",
  );
  if (!uso) {
    throw new Error("El agente no devolvió un resultado estructurado.");
  }

  return uso.input as ProspectoExtraido;
}
