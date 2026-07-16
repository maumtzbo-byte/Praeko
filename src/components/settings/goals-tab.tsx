"use client";

import { useState } from "react";
import { toast } from "sonner";
import { goalsSchema, type GoalsInput } from "@/lib/validation/onboarding";
import { flattenZodErrors } from "@/lib/validation/utils";
import { saveGoals } from "@/app/onboarding/actions";
import { GoalsStep } from "@/components/onboarding/steps/goals-step";
import { SettingsSection } from "./settings-section";

export function GoalsTab({ businessId, initial }: { businessId: string; initial: GoalsInput }) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof GoalsInput, string>>>({});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setErrors({});
    const parsed = goalsSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setSaving(true);
    const res = await saveGoals(businessId, value);
    setSaving(false);
    if (!res.success) return toast.error(res.error);
    toast.success("Objetivos actualizados.");
  }

  return (
    <SettingsSection title="Objetivos" description="Qué quieres lograr con Praeko." saving={saving} onSave={handleSave}>
      <GoalsStep value={value} onChange={(p) => setValue((v) => ({ ...v, ...p }))} errors={errors} />
    </SettingsSection>
  );
}
