import type Anthropic from "@anthropic-ai/sdk";
import { getClaudeClient } from "./claude-client";
import type { ContentKind } from "@/lib/content/types";

/**
 * Agente Creativo — prompt bridge. The script the strategy agent writes is
 * staged for a HUMAN presenter: "gancho inicial, desarrollo, cierre",
 * meant to be read on camera (see strategy-script-agent.ts's system
 * prompt). Feeding that straight to an image model is a real mismatch —
 * Flux has no concept of a spoken script, it needs a visual composition
 * (subject, setting, framing, lighting). Video models fare a little
 * better (Kling 3.0 can generate lip-synced Spanish dialogue from spoken
 * text), but without an explicit scene description they still don't know
 * what should be ON SCREEN while that dialogue plays — who's in frame,
 * where, doing what.
 *
 * This step asks Claude to translate {topic, script} into an actual
 * generation prompt: a visual scene description for the model to render,
 * keeping the script's spoken content as dialogue context for video (where
 * the model can use it) rather than discarding it.
 */
export interface VisualPromptInput {
  contentKind: ContentKind;
  topic: string;
  script: string;
  targetDurationSeconds: number | null;
  brandContext: string;
}

const VISUAL_PROMPT_TOOL_NAME = "submit_visual_prompt";

function buildSystemPrompt(contentKind: ContentKind): string {
  const shared = [
    "Eres el Agente Creativo de Frames, una plataforma de marketing con IA para negocios pequeños en México.",
    "Recibes un guion escrito para que el dueño del negocio lo grabe o diseñe él mismo (con gancho, desarrollo y cierre) — tu trabajo es traducirlo a un prompt de generación visual que un modelo de IA (no una persona) pueda producir directamente.",
    "No inventes elementos de marca, productos, personas o textos en pantalla que no se desprendan directamente del tema y el guion dados.",
  ];

  const kindSpecific =
    contentKind === "video"
      ? [
          "Este prompt es para un modelo de video con IA que SÍ puede generar diálogo hablado y sincronización de labios en español — así que conserva el contenido hablado del guion como diálogo, pero agrégale lo que el guion no dice: quién aparece en cámara, dónde está, qué está haciendo, tipo de encuadre (close-up, plano medio, etc.), iluminación y ambiente. Sin esa descripción visual, el modelo no sabe qué mostrar mientras se escucha el diálogo.",
          "Estructura el prompt en dos partes claras: primero la descripción visual de la escena, después el diálogo/narración a decir.",
        ]
      : [
          "Este prompt es para un modelo de generación de imágenes — no entiende guiones hablados ni estructura de gancho/desarrollo/cierre. Convierte la idea central del tema y el guion en una composición visual concreta: sujeto, encuadre, fondo, iluminación, estilo — nunca texto hablado ni diálogo.",
        ];

  return [...shared, ...kindSpecific, "Responde únicamente llamando a la herramienta proporcionada — no escribas texto fuera de la llamada."].join("\n");
}

function buildUserPrompt(input: VisualPromptInput): string {
  const lines = [
    `Contexto de marca: ${input.brandContext}`,
    `Tema: ${input.topic}`,
    `Guion original (escrito para un presentador humano): ${input.script}`,
    input.contentKind === "video" && input.targetDurationSeconds
      ? `Duración objetivo: ${input.targetDurationSeconds} segundos — el ritmo de la escena y la cantidad de diálogo deben caber en ese tiempo.`
      : null,
  ].filter((line): line is string => line !== null);
  return lines.join("\n");
}

function visualPromptSchema() {
  return {
    type: "object" as const,
    properties: {
      visual_prompt: {
        type: "string",
        description: "El prompt final de generación, en español, listo para enviarse al modelo de imagen/video.",
      },
    },
    required: ["visual_prompt"],
    additionalProperties: false,
  };
}

/**
 * Falls back to the raw topic+script concatenation (the previous
 * behavior) on any failure — a worse prompt is still better than blocking
 * generation entirely over a translation step that's meant to improve
 * quality, not gate it.
 */
export async function craftVisualPrompt(input: VisualPromptInput): Promise<string> {
  const fallback = `${input.topic}\n\n${input.script}`;

  try {
    const client = getClaudeClient();
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: buildSystemPrompt(input.contentKind),
      messages: [{ role: "user", content: buildUserPrompt(input) }],
      tools: [
        {
          name: VISUAL_PROMPT_TOOL_NAME,
          description: "Entrega el prompt visual final de generación.",
          input_schema: visualPromptSchema(),
          strict: true,
        },
      ],
      tool_choice: { type: "tool", name: VISUAL_PROMPT_TOOL_NAME },
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    const raw = toolUse?.input as { visual_prompt?: string } | undefined;
    return raw?.visual_prompt?.trim() || fallback;
  } catch (err) {
    console.error("craftVisualPrompt failed, falling back to raw script", err);
    return fallback;
  }
}
