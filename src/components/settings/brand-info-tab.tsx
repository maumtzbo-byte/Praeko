"use client";

import { useState } from "react";
import { toast } from "sonner";
import { brandInfoSchema, type BrandInfoInput } from "@/lib/validation/onboarding";
import { flattenZodErrors } from "@/lib/validation/utils";
import { saveBrandInfo } from "@/app/onboarding/actions";
import { BrandInfoStep } from "@/components/onboarding/steps/brand-info-step";
import { SettingsSection } from "./settings-section";

export function BrandInfoTab({
  businessId,
  initial,
  initialLogoUrl,
}: {
  businessId: string;
  initial: BrandInfoInput;
  initialLogoUrl: string | null;
}) {
  const [value, setValue] = useState(initial);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [errors, setErrors] = useState<Partial<Record<keyof BrandInfoInput, string>>>({});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setErrors({});
    const parsed = brandInfoSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setSaving(true);
    const res = await saveBrandInfo(businessId, value);
    setSaving(false);
    if (!res.success) return toast.error(res.error);
    toast.success("Marca actualizada.");
  }

  return (
    <SettingsSection title="Marca" description="Cómo se ve y se comunica tu marca." saving={saving} onSave={handleSave}>
      <BrandInfoStep
        businessId={businessId}
        value={value}
        onChange={(p) => setValue((v) => ({ ...v, ...p }))}
        errors={errors}
        logoUrl={logoUrl}
        onLogoUploaded={setLogoUrl}
      />
    </SettingsSection>
  );
}
