"use client";

import { useState } from "react";
import { toast } from "sonner";
import { aiInfoSchema, type AiInfoInput } from "@/lib/validation/onboarding";
import { flattenZodErrors } from "@/lib/validation/utils";
import { saveAiInfoAndComplete } from "@/app/onboarding/actions";
import { AiInfoStep } from "@/components/onboarding/steps/ai-info-step";
import { SettingsSection } from "./settings-section";

export function AiInfoTab({ businessId, initial }: { businessId: string; initial: AiInfoInput }) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof AiInfoInput, string>>>({});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setErrors({});
    const parsed = aiInfoSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setSaving(true);
    // Reuses the onboarding "final step" action — safe here too since it
    // only (re)sets brand_profiles fields plus onboarding_completed_at,
    // which stays a no-op update once onboarding is already complete.
    const res = await saveAiInfoAndComplete(businessId, value);
    setSaving(false);
    if (!res.success) return toast.error(res.error);
    toast.success("Información para la IA actualizada.");
  }

  return (
    <SettingsSection
      title="Información para la IA"
      description="Reglas claras para que la IA nunca se salga de tono."
      saving={saving}
      onSave={handleSave}
    >
      <AiInfoStep value={value} onChange={(p) => setValue((v) => ({ ...v, ...p }))} errors={errors} />
    </SettingsSection>
  );
}
