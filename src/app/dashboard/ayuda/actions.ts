"use server";

import { createClient } from "@/lib/supabase/server";
import { getClaudeClient } from "@/lib/agents/claude-client";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// Hard ceiling on paid Claude calls per business per day — protects against
// runaway spend from an open tab or someone spamming the chat. A real
// back-and-forth easily fits in 30 messages.
const MAX_SUPPORT_MESSAGES_PER_DAY = 30;

const SUPPORT_SYSTEM_PROMPT = [
  "Eres el asistente de soporte de Frames, una plataforma de marketing con IA para negocios pequeños en México.",
  "Tu único trabajo es ayudar al cliente a entender cómo usar el panel de Frames — no generas contenido de marketing, solo explicas la app.",
  "Estas son las secciones reales del menú y qué hace cada una:",
  "- Dashboard: resumen general del negocio, incluyendo alcance, crecimiento de seguidores, videos más virales y qué red social funciona mejor.",
  "- Generar contenido: la IA propone un plan de contenido (imágenes y videos) según la marca y el plan contratado.",
  "- Calendario: qué se publica cada día, según lo que generó la IA.",
  "- Galería: aquí el cliente sube sus propias fotos de referencia (negocio, productos, estilo) para que la IA las use como inspiración al crear contenido nuevo.",
  "- Redes sociales: aquí se conectan de verdad las cuentas de Instagram, Facebook y TikTok (botón \"Conectar\", autoriza con su cuenta real) — sin esto la IA no puede publicar directo.",
  "- Biblioteca multimedia: todo el contenido que la IA ya generó, listo para descargar o reutilizar.",
  "- Publicaciones programadas: lo que ya está agendado para publicarse.",
  "- IA de Marketing: asistente para preguntas de estrategia de marketing.",
  "- Marca: el kit de marca (logo, colores, tono, misión) que usan los agentes de IA — se edita desde Configuración.",
  "- Configuración: datos del negocio, marca, redes, seguridad y notificaciones.",
  "- Facturación y Mi plan: método de pago y qué incluye su plan actual.",
  "Reglas de estilo:",
  "- Responde siempre en español, corto y directo — de preferencia en pasos numerados si es un procedimiento.",
  "- Nunca inventes botones, menús o funciones que no están en esta lista.",
  "- Si la pregunta no es sobre cómo usar Frames (por ejemplo, temas de facturación específicos de su cuenta, quejas, o algo fuera de la app), dile amablemente que escriba a soporte@frames.com en vez de inventar una respuesta.",
].join("\n");

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Answers one turn of the Ayuda support chat. The conversation itself is
 * never persisted — only a per-message counter, to rate-limit the paid
 * Claude call (same pattern as content_generation_runs). */
export async function sendSupportChatMessage(
  businessId: string,
  history: ChatMessage[],
): Promise<ActionResult<{ reply: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const { count: messagesToday } = await supabase
      .from("support_chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", startOfToday.toISOString());

    if ((messagesToday ?? 0) >= MAX_SUPPORT_MESSAGES_PER_DAY) {
      return {
        success: false,
        error: "Ya usaste el máximo de mensajes de hoy. Vuelve mañana o escríbenos a soporte@frames.com.",
      };
    }

    let reply: string;
    try {
      const message = await getClaudeClient().messages.create({
        model: "claude-sonnet-5",
        max_tokens: 1024,
        thinking: { type: "disabled" },
        system: SUPPORT_SYSTEM_PROMPT,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      });
      const textBlock = message.content.find((block) => block.type === "text");
      reply = textBlock?.text ?? "No pude generar una respuesta. Intenta de nuevo.";
    } catch (err) {
      console.error("support chat Claude call failed", err);
      return { success: false, error: "No se pudo contactar al asistente. Intenta de nuevo en un momento." };
    }

    const { error: logError } = await supabase
      .from("support_chat_messages")
      .insert({ business_id: businessId });
    if (logError) console.error("support_chat_messages insert failed", logError);

    return { success: true, data: { reply } };
  } catch (err) {
    console.error("sendSupportChatMessage failed", err);
    return { success: false, error: "Ocurrió un error inesperado." };
  }
}
