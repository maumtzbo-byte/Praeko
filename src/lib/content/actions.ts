"use server";

import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

/** Puts a failed content_calendar row back into the generation queue instead
 * of leaving it as a dead end — there's no per-item regeneration pipeline
 * yet, so this is the honest, minimal version: reset to "pendiente" so it's
 * picked up the same way any other pending piece is. */
export async function retryFailedContent(itemId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    const { error } = await supabase
      .from("content_calendar")
      .update({ status: "pendiente" })
      .eq("id", itemId)
      .eq("status", "fallida");

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    console.error("retryFailedContent failed", err);
    return { success: false, error: "No se pudo reintentar. Intenta de nuevo." };
  }
}

/** The Agente Revisor de Marca flags a piece as "en_revision" (either
 * "necesita_revision_humana" or "rechazado") but nothing ever moved it back
 * out of that state — it was a dead end with no resolution path. This is
 * the owner manually overriding the review after reading its feedback,
 * same minimal "reset to pendiente" pattern as retryFailedContent. */
export async function approveReviewedContent(itemId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    const { error } = await supabase
      .from("content_calendar")
      .update({ status: "pendiente" })
      .eq("id", itemId)
      .eq("status", "en_revision");

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    console.error("approveReviewedContent failed", err);
    return { success: false, error: "No se pudo aprobar. Intenta de nuevo." };
  }
}
