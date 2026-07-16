import type Anthropic from "@anthropic-ai/sdk";
import { getClaudeClient } from "./claude-client";
import type { ContentFormat, ContentKind } from "@/lib/content/types";
import { canGenerateVideo, type PlanLimits } from "@/lib/plans/limits";

/**
 * Output contract for the combined agente de estrategia + agente de guiones
 * (spec 1.3): brand profile + plan budget in, a day-by-day content plan out
 * as structured JSON (forced tool use), ready to insert into
 * content_calendar.
 */
export interface StrategyDayPlan {
  date: string; // ISO date, e.g. "2026-08-01"
  contentKind: ContentKind;
  format: ContentFormat;
  topic: string;
  script: string;
  /** Only set when contentKind is "video"; clamped against the plan's budget. */
  targetDurationSeconds?: number;
  recommendedPublishTime: string; // "HH:MM", 24h
}

export interface MonthlyStrategyPlan {
  days: StrategyDayPlan[];
}

export interface StrategyAgentInput {
  business: {
    name: string;
    industry: string | null;
    description: string | null;
    country: string | null;
    city: string | null;
  };
  brand: {
    brandTone: string | null;
    mission: string | null;
    targetAudience: string | null;
    brandValues: string[];
    sellsDescription: string | null;
    mainProducts: string[];
    goals: string[];
  };
  plan: PlanLimits;
  /** ISO date (YYYY-MM-DD) of the first day to plan. */
  startDate: string;
  /** How many days of content to generate in this call. */
  days: number;
}

const CONTENT_KINDS: ContentKind[] = ["imagen", "video"];
const CONTENT_FORMATS: ContentFormat[] = ["reel", "carrusel", "imagen_unica", "promocion"];

const PLAN_TOOL_NAME = "submit_content_plan";

function buildSystemPrompt(): string {
  return [
    "Eres el agente de estrategia y guionista de Praeko, una plataforma de marketing con IA para negocios pequeños en México.",
    "Tu trabajo es proponer un plan de contenido día por día para redes sociales, con guiones listos para grabar o diseñar.",
    "Reglas:",
    "- Escribe siempre en español, con el tono de marca que se te da.",
    "- Cada pieza debe conectar con un objetivo de negocio real, no contenido genérico.",
    "- Los guiones de video deben incluir gancho inicial, desarrollo y cierre con llamada a la acción, listos para grabarse tal cual.",
    "- Varía los formatos y temas a lo largo de los días; no repitas el mismo tema dos días seguidos.",
    "- Respeta el proveedor de video asignado al plan del negocio al proponer el nivel de producción esperado.",
    "Responde únicamente llamando a la herramienta proporcionada — no escribas texto fuera de la llamada.",
  ].join("\n");
}

function buildUserPrompt(input: StrategyAgentInput): string {
  const { business, brand, plan } = input;
  const lines = [
    `Negocio: ${business.name}`,
    business.industry ? `Giro: ${business.industry}` : null,
    business.description ? `Descripción: ${business.description}` : null,
    business.city || business.country
      ? `Ubicación: ${[business.city, business.country].filter(Boolean).join(", ")}`
      : null,
    brand.brandTone ? `Tono de marca: ${brand.brandTone}` : null,
    brand.mission ? `Misión: ${brand.mission}` : null,
    brand.targetAudience ? `Público objetivo: ${brand.targetAudience}` : null,
    brand.brandValues.length ? `Valores de marca: ${brand.brandValues.join(", ")}` : null,
    brand.sellsDescription ? `Qué vende: ${brand.sellsDescription}` : null,
    brand.mainProducts.length ? `Productos o servicios principales: ${brand.mainProducts.join(", ")}` : null,
    brand.goals.length ? `Objetivos de marketing: ${brand.goals.join(", ")}` : null,
    "",
    `Plan contratado: ${plan.displayName}`,
    `Límite de videos al mes: ${plan.videosPerMonth} (máximo ${plan.videoMaxSeconds}s por video, proveedor ${plan.videoProvider})`,
    `Límite de imágenes al mes: ${plan.imagesPerMonth}`,
    "",
    `Genera ${input.days} días de contenido empezando el ${input.startDate} (fechas consecutivas, formato YYYY-MM-DD).`,
    "Distribuye una mezcla razonable de imagen y video según los límites del plan.",
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

function planDaySchema() {
  return {
    type: "object" as const,
    properties: {
      days: {
        type: "array",
        items: {
          type: "object",
          properties: {
            date: { type: "string", description: "Fecha ISO, YYYY-MM-DD" },
            contentKind: { type: "string", enum: CONTENT_KINDS },
            format: { type: "string", enum: CONTENT_FORMATS },
            topic: { type: "string", description: "Tema o gancho central de la pieza" },
            script: { type: "string", description: "Guion completo listo para producir" },
            targetDurationSeconds: {
              type: "integer",
              description: "Solo si contentKind es video",
            },
            recommendedPublishTime: { type: "string", description: "Hora recomendada, formato HH:MM 24h" },
          },
          required: ["date", "contentKind", "format", "topic", "script", "recommendedPublishTime"],
          additionalProperties: false,
        },
      },
    },
    required: ["days"],
    additionalProperties: false,
  };
}

/** Clamps generated video days against the plan's seconds-of-video budget (see plans/limits.ts). */
function enforceVideoBudget(days: StrategyDayPlan[], plan: PlanLimits): StrategyDayPlan[] {
  let videosUsedSoFar = 0;
  let secondsUsedSoFar = 0;

  return days.map((day) => {
    if (day.contentKind !== "video") return day;

    const requestedSeconds = Math.min(
      day.targetDurationSeconds ?? plan.videoAvgSeconds,
      plan.videoMaxSeconds,
    );
    const check = canGenerateVideo(plan, { requestedSeconds, secondsUsedSoFar, videosUsedSoFar });

    if (!check.allowed) {
      return {
        ...day,
        contentKind: "imagen" as ContentKind,
        format: day.format === "promocion" ? "promocion" : ("imagen_unica" as ContentFormat),
        targetDurationSeconds: undefined,
      };
    }

    videosUsedSoFar += 1;
    secondsUsedSoFar += requestedSeconds;
    return { ...day, targetDurationSeconds: requestedSeconds };
  });
}

export async function generateMonthlyStrategy(input: StrategyAgentInput): Promise<MonthlyStrategyPlan> {
  const client = getClaudeClient();

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 8000,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(input) }],
    tools: [
      {
        name: PLAN_TOOL_NAME,
        description: "Entrega el plan de contenido estructurado día por día.",
        input_schema: planDaySchema(),
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: PLAN_TOOL_NAME },
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("La IA no devolvió un plan estructurado. Intenta de nuevo.");
  }

  const raw = toolUse.input as { days: StrategyDayPlan[] };
  if (!raw.days?.length) {
    throw new Error("La IA no generó ningún día de contenido.");
  }

  return { days: enforceVideoBudget(raw.days, input.plan) };
}
