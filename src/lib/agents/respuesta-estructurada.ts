import type Anthropic from "@anthropic-ai/sdk";

/**
 * Saca el bloque de herramienta de una respuesta de Claude, o falla fuerte.
 *
 * Existe por un caso que ninguno de los cinco agentes estructurados
 * atrapaba: `stop_reason: "max_tokens"`.
 *
 * Cuando el modelo llega al techo de tokens a media llamada de herramienta,
 * la respuesta SIGUE trayendo un bloque `tool_use` — con el JSON cortado a
 * la mitad. El SDK entrega lo que alcanzó a parsear, así que
 * `message.content.find(...)` lo encuentra, el `if (!toolUse) throw` no se
 * dispara, y el código de arriba se queda con un objeto incompleto creyendo
 * que está completo.
 *
 * En el agente de estrategia eso significa un plan de 30 días que llega con
 * 19 y se guarda como si fueran 30: el negocio pagó un mes y le quedaron
 * once días vacíos que nadie va a notar hasta que se acabe el contenido.
 * Fallar aquí es mucho mejor — la corrida se vuelve a lanzar y ya.
 */
export function bloqueDeHerramienta(
  message: Anthropic.Message,
  queAgente: string,
): Anthropic.ToolUseBlock {
  if (message.stop_reason === "max_tokens") {
    throw new Error(
      `${queAgente} se quedó sin espacio a media respuesta y lo que devolvió está incompleto. Vuelve a intentar.`,
    );
  }

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error(`${queAgente} no devolvió un resultado estructurado. Vuelve a intentar.`);
  }

  return toolUse;
}
