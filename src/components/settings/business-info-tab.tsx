"use client";

import { useState } from "react";
import { toast } from "sonner";
import { businessInfoSchema, type BusinessInfoInput } from "@/lib/validation/onboarding";
import { flattenZodErrors } from "@/lib/validation/utils";
import { saveBusinessInfo } from "@/app/onboarding/actions";
import { BusinessInfoStep } from "@/components/onboarding/steps/business-info-step";
import { SettingsSection } from "./settings-section";

export function BusinessInfoTab({ businessId, initial }: { businessId: string; initial: BusinessInfoInput }) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof BusinessInfoInput, string>>>({});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setErrors({});
    const parsed = businessInfoSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setSaving(true);
    const res = await saveBusinessInfo(businessId, value);
    setSaving(false);
    if (!res.success) return toast.error(res.error);
    toast.success("Datos generales actualizados.");
  }

  return (
    <SettingsSection title="Datos generales" description="La información básica de tu negocio." saving={saving} onSave={handleSave}>
      <BusinessInfoStep value={value} onChange={(p) => setValue((v) => ({ ...v, ...p }))} errors={errors} />
    </SettingsSection>
  );
}
