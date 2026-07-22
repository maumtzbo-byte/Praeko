import type { Tables } from "@/lib/supabase/types";

type Campaign = Tables<"campaigns">;

export type CampaignDisplayStatus = "activa" | "completada" | "cancelada";

/**
 * The stored `status` column only ever distinguishes "cancelled by the
 * owner" from "not cancelled" — nothing flips it to "completada" once
 * end_date passes (no scheduled job for that yet), so "completed" is
 * derived here from today's date instead of trusted from the column.
 */
export function deriveCampaignStatus(campaign: Pick<Campaign, "status" | "end_date">): CampaignDisplayStatus {
  if (campaign.status === "cancelada") return "cancelada";
  const today = new Date().toISOString().slice(0, 10);
  if (today > campaign.end_date) return "completada";
  return "activa";
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignDisplayStatus, string> = {
  activa: "Activa",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const CAMPAIGN_STATUS_VARIANTS: Record<CampaignDisplayStatus, "neutral" | "success" | "warning" | "danger"> = {
  activa: "success",
  completada: "neutral",
  cancelada: "danger",
};

/** 0-100, clamped — how far today is between start_date and end_date. */
export function campaignProgress(campaign: Pick<Campaign, "start_date" | "end_date">): number {
  const start = new Date(`${campaign.start_date}T00:00:00Z`).getTime();
  const end = new Date(`${campaign.end_date}T00:00:00Z`).getTime();
  const now = Date.now();
  if (now <= start) return 0;
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}
