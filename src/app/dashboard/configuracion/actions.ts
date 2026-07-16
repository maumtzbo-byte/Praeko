"use server";

import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";

export interface NotificationPreferences {
  content_ready: boolean;
  weekly_summary: boolean;
  billing: boolean;
}

export async function saveNotificationPreferences(
  businessId: string,
  preferences: NotificationPreferences,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .update({ notification_preferences: preferences as unknown as Json })
    .eq("id", businessId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
