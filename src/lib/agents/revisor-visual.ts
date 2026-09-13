import type Anthropic from "@anthropic-ai/sdk";

import { getClaudeClient } from "./claude-client";

/**
 * Agente que MIRA la pieza generada.
 *
 * El revisor de marca que ya existía (brand-reviewer-agent) lee el guion:
 * juzga si el texto suena al negocio. Es ciego a todo lo que de verdad
 * falla en la generación de imagen y video —una mano con seis dedos, una
 * etiqueta con letras inventadas, un frasco que no es el del cliente—
 * porque esas cosas no están en el texto, están en los píxeles.
 *
 * Y son justo las que no se pueden dejar pasar: una pieza así no es "de
 * menor calidad", es una pieza que no se puede publicar bajo la marca de
 * alguien más.
 *
 * La jugada que hace esto valioso es la COMPARACIÓN: se le da la foto real
 * del producto junto a la pieza generada y se le pregunta si es el mismo
 * producto. Ese es el error más caro de todos —un producto que se parece
 * pero no es— y es imposible de detectar sin ver las dos imágenes.
 *
 * Lo que NO hace, y está dicho en el prompt: no opina de estilo, de
 * composición ni de gusto. Un revisor que marca todo no sirve de nada,
 * porque lo primero que hace quien lo usa es dejar de leerlo.
 *
 * Límite conocido: revisa IMÁGENES. Para un video hace falta sacar cuadros,
 * y eso necesita ffmpeg, que no corre en una función de Vercel. Hoy se le
 * pasa la miniatura cuando fal.ai la manda —el primer cuadro ya trae la
 * mayoría de los defectos de producto— y las piezas de imagen completas.
 * El día que haya un worker con ffmpeg, esta función no cambia: nada más
 * se le pasan más URLs.
 */

export type VeredictoVisual = "aprobado" | "necesita_revision_humana" | "rechazado";

export type RevisionVisual = {
  veredicto: VeredictoVisual;
  /** Qué está mal, concreto y en español. Vacío si está aprobada. */
  problemas: string[];
  /** Si el producto de la pieza es el mismo de la foto de referencia.
   *  null cuando no se dio foto con qué comparar. */
  mismoProducto: boolean | null;
};

const HERRAMIENTA = "entregar_revision";

/** Sonnet y no Opus: es una tarea de percepción acotada, se corre una vez
 *  por pieza (hasta 36 al mes por cliente) y el costo importa — ver
 *  src/lib/plans/margen.ts. */
const MODELO = "claude-sonnet-5";

function sistema(): string {
  return [
    "Eres el revisor visual de Frames, una agencia que produce contenido con IA para marcas de producto empacado en México.",
    "Miras una pieza generada ANTES de que se la enseñen al cliente y buscas defectos de generación. Nada más eso.",
    "",
    "BUSCA exactamente esto:",
    "- Manos, dedos o cuerpos deformes: dedos de más, de menos, articulaciones imposibles.",
    "- Texto inventado o ilegible. Es el defecto más común y el más delator: letras que parecen letras pero no dicen nada, o una etiqueta con el nombre de la marca mal escrito.",
    "- El producto no es el mismo de la foto de referencia: otra forma de frasco, otra tapa, otro color, otra etiqueta.",
    "- Objetos que se funden entre sí, se repiten, o flotan sin razón.",
    "- Reflejos o sombras que contradicen la luz de la escena.",
    "- Partes del producto que se cortan, se derriten o cambian de material.",
    "",
    "NO marques nada de esto:",
    "- Estilo, paleta, composición o gusto. No es tu trabajo y marcar de más hace que nadie te lea.",
    "- Que se note producida o de estudio. Eso es lo que se compró.",
    "- Fondos simples, mucho aire alrededor del producto, o iluminación pareja.",
    "",
    "Veredictos:",
    "- 'aprobado': sin defectos de generación. Es el veredicto por omisión; úsalo cuando la pieza simplemente está bien.",
    "- 'necesita_revision_humana': hay algo raro pero podría pasar, o no estás seguro. Di exactamente dónde mirar.",
    "- 'rechazado': hay un defecto que un cliente notaría de inmediato, o el producto no es el suyo. Esta pieza no se publica.",
    "",
    "Los problemas van en español, concretos y ubicados ('la mano derecha que sostiene el frasco tiene cuatro dedos'), nunca vagos ('se ve raro').",
    "Responde únicamente llamando a la herramienta.",
  ].join("\n");
}

function esquema() {
  return {
    type: "object" as const,
    properties: {
      veredicto: {
        type: "string" as const,
        enum: ["aprobado", "necesita_revision_humana", "rechazado"],
      },
      problemas: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "Defectos concretos y ubicados. Vacío si está aprobada.",
      },
      mismoProducto: {
        anyOf: [{ type: "boolean" as const }, { type: "null" as const }],
        description:
          "Si el producto de la pieza es el mismo de la foto de referencia. null si no se dio foto de referencia.",
      },
    },
    required: ["veredicto", "problemas", "mismoProducto"],
    additionalProperties: false,
  };
}

export type EntradaRevision = {
  /** La pieza generada. */
  urlPieza: string;
  /** La foto real del producto, para comparar. Opcional pero es lo que
   *  más valor agrega. */
  urlReferencia?: string;
  marca: string;
  /** Qué se supone que muestra la pieza, del guion. Ayuda a distinguir un
   *  defecto de algo que se pidió a propósito. */
  descripcion?: string;
};

export async function revisarPieza(entrada: EntradaRevision): Promise<RevisionVisual> {
  const bloques: Anthropic.ContentBlockParam[] = [];

  if (entrada.urlReferencia) {
    bloques.push({ type: "text", text: "Foto REAL del producto del cliente, para comparar:" });
    bloques.push({ type: "image", source: { type: "url", url: entrada.urlReferencia } });
  }

  bloques.push({ type: "text", text: "Pieza generada que hay que revisar:" });
  bloques.push({ type: "image", source: { type: "url", url: entrada.urlPieza } });

  const contexto = [
    `Marca: ${entrada.marca}`,
    entrada.descripcion ? `Lo que la pieza debe mostrar: ${entrada.descripcion}` : null,
    entrada.urlReferencia
      ? "Compara el producto de la pieza contra la foto de referencia."
      : "No hay foto de referencia: deja mismoProducto en null.",
  ]
    .filter(Boolean)
    .join("\n");
  bloques.push({ type: "text", text: contexto });

  const mensaje = await getClaudeClient().messages.create({
    model: MODELO,
    max_tokens: 1500,
    system: sistema(),
    messages: [{ role: "user", content: bloques }],
    tools: [
      {
        name: HERRAMIENTA,
        description: "Entrega el veredicto de la revisión visual.",
        input_schema: esquema(),
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: HERRAMIENTA },
  });

  const uso = mensaje.content.find(
    (bloque): bloque is Anthropic.ToolUseBlock => bloque.type === "tool_use",
  );
  if (!uso) throw new Error("El revisor visual no devolvió un resultado estructurado.");

  return uso.input as RevisionVisual;
}
