"use server";

import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: true } | { success: false; error: string };

/** Monthly "1-5 estrellas, ¿alguna recomendación?" prompt (see FeedbackModal
 * + shouldPromptFeedback in dashboard/layout.tsx). Cookie-bound client, not
 * service-role: feedback_submissions_insert's RLS policy (business members
 * only) does the ownership check for free, same pattern as every other
 * business-scoped write in this app. */
export async function submitFeedback(
  businessId: string,
  rating: number,
  recommendation: string,
): Promise<ActionResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, error: "Selecciona una calificación de 1 a 5 estrellas." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("feedback_submissions").insert({
      business_id: businessId,
      rating,
      recommendation: recommendation.trim() || null,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    console.error("submitFeedback failed", err);
    return { success: false, error: "No se pudo enviar tu respuesta. Intenta de nuevo." };
  }
}
