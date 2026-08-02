import type Anthropic from "@anthropic-ai/sdk";
import { getClaudeClient } from "./claude-client";
import type { ContentFormat, ContentKind } from "@/lib/content/types";
import { canGenerateVideo, type PlanLimits } from "@/lib/plans/limits";
import { getUpcomingKeyDates } from "@/lib/content/mexico-key-dates";

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
    "Eres el agente de estrategia y guionista de Frames, una plataforma de marketing con IA para negocios pequeños en México.",
    "Tu trabajo es proponer un plan de contenido día por día para redes sociales, con guiones listos para grabar o diseñar.",
    "Reglas:",
    "- Escribe siempre en español, con el tono de marca que se te da.",
    "- Cada pieza debe conectar con un objetivo de negocio real, no contenido genérico.",
    "- Los guiones de video deben incluir gancho inicial, desarrollo y cierre con llamada a la acción, listos para grabarse tal cual.",
    "- Varía los formatos y temas a lo largo de los días; no repitas el mismo tema dos días seguidos.",
    "- Respeta el proveedor de video asignado al plan del negocio al proponer el nivel de producción esperado.",
    "- Si se te dan fechas clave de México dentro del rango, úsalas cuando tengan sentido real para este negocio (no fuerces una fecha genérica en un negocio al que no le aplica).",
    "Responde únicamente llamando a la herramienta proporcionada — no escribas texto fuera de la llamada.",
  ].join("\n");
}

/** Agente de Tendencias: formats key dates falling inside the generation
 * window as a prompt section, or null if none fall in range. */
function buildKeyDatesSection(startDate: string, days: number): string | null {
  const keyDates = getUpcomingKeyDates(startDate, days);
  if (keyDates.length === 0) return null;

  const lines = keyDates.map(
    (d) => `- ${d.date}: ${d.name}${d.approximate ? " (fecha aproximada, confírmala)" : ""} — ${d.angle}`,
  );
  return [
    "Fechas clave de México dentro de este rango (aprovecha las que tengan sentido para este negocio, sin forzar todas):",
    ...lines,
  ].join("\n");
}

function buildUserPrompt(input: StrategyAgentInput): string {
  const { business, brand, plan } = input;
  const keyDatesSection = buildKeyDatesSection(input.startDate, input.days);
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
    keyDatesSection,
    keyDatesSection ? "" : null,
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

async function callStrategyAgent(system: string, user: string, plan: PlanLimits): Promise<MonthlyStrategyPlan> {
  const client = getClaudeClient();

  const message = await client.messages.create({
    model: plan.contentModel,
    max_tokens: 8000,
    system,
    messages: [{ role: "user", content: user }],
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

  return { days: enforceVideoBudget(raw.days, plan) };
}

export async function generateMonthlyStrategy(input: StrategyAgentInput): Promise<MonthlyStrategyPlan> {
  return callStrategyAgent(buildSystemPrompt(), buildUserPrompt(input), input.plan);
}

export interface CampaignAgentInput {
  business: StrategyAgentInput["business"];
  brand: StrategyAgentInput["brand"];
  plan: PlanLimits;
  campaign: {
    name: string;
    /** Free text from the owner describing what the campaign is for — "Hot Sale, 20% en toda la tienda", "Navidad, promocionar canastas navideñas", etc. */
    brief: string;
    /** ISO date (YYYY-MM-DD), inclusive. */
    startDate: string;
    /** ISO date (YYYY-MM-DD), inclusive. */
    endDate: string;
  };
}

function buildCampaignSystemPrompt(): string {
  return [
    "Eres el agente de estrategia y guionista de Frames, una plataforma de marketing con IA para negocios pequeños en México.",
    "Tu trabajo ahora es planear una CAMPAÑA completa: una serie de piezas conectadas entre sí que llevan a los clientes hacia una fecha o evento específico (ej. Hot Sale, Navidad, Buen Fin, aniversario, lanzamiento).",
    "Reglas:",
    "- Escribe siempre en español, con el tono de marca que se te da.",
    "- Todas las piezas deben conectar explícitamente con el tema y el objetivo de la campaña — no vuelvas a contenido genérico del negocio.",
    "- Construye un arco a lo largo de la campaña: los primeros días generan anticipación/aviso, los días intermedios refuerzan el mensaje y el valor, y los últimos días (sobre todo el último) empujan urgencia y llamada a la acción clara para cerrar.",
    "- Genera exactamente un día de contenido por cada día del rango de fechas de la campaña — ni más ni menos.",
    "- Los guiones de video deben incluir gancho inicial, desarrollo y cierre con llamada a la acción, listos para grabarse tal cual.",
    "- Varía los formatos a lo largo de la campaña; no repitas el mismo formato dos días seguidos si se puede evitar.",
    "- Respeta el proveedor de video asignado al plan del negocio al proponer el nivel de producción esperado.",
    "- Si se te da la fecha clave de México que da origen a la campaña, ancla el arco de la campaña hacia esa fecha; si hay otras fechas clave dentro del rango, úsalas solo si tienen sentido real para este negocio.",
    "Responde únicamente llamando a la herramienta proporcionada — no escribas texto fuera de la llamada.",
  ].join("\n");
}

function buildCampaignUserPrompt(input: CampaignAgentInput): string {
  const { business, brand, plan, campaign } = input;
  const days = daysBetweenInclusive(campaign.startDate, campaign.endDate);
  const keyDatesSection = buildKeyDatesSection(campaign.startDate, days);
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
    "",
    `Plan contratado: ${plan.displayName}`,
    `Límite de videos al mes: ${plan.videosPerMonth} (máximo ${plan.videoMaxSeconds}s por video, proveedor ${plan.videoProvider})`,
    `Límite de imágenes al mes: ${plan.imagesPerMonth}`,
    "",
    keyDatesSection,
    keyDatesSection ? "" : null,
    `CAMPAÑA: ${campaign.name}`,
    `Lo que el dueño del negocio pidió para esta campaña: ${campaign.brief}`,
    `Duración: del ${campaign.startDate} al ${campaign.endDate} (${days} días, fechas consecutivas, formato YYYY-MM-DD).`,
    `Genera exactamente ${days} días de contenido, uno por cada fecha del rango, construyendo el arco de la campaña hacia el último día.`,
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

function daysBetweenInclusive(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000) + 1;
}

export async function generateCampaignPlan(input: CampaignAgentInput): Promise<MonthlyStrategyPlan> {
  return callStrategyAgent(buildCampaignSystemPrompt(), buildCampaignUserPrompt(input), input.plan);
}
