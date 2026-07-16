"use client";

import { useState } from "react";
import { toast } from "sonner";
import { socialLinksSchema, type SocialLinksInput } from "@/lib/validation/onboarding";
import { saveSocialLinks } from "@/app/onboarding/actions";
import { SocialLinksStep } from "@/components/onboarding/steps/social-links-step";
import { SettingsSection } from "./settings-section";

export function SocialLinksTab({ businessId, initial }: { businessId: string; initial: SocialLinksInput }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = socialLinksSchema.safeParse(value);
    if (!parsed.success) return;
    setSaving(true);
    const res = await saveSocialLinks(businessId, value);
    setSaving(false);
    if (!res.success) return toast.error(res.error);
    toast.success("Redes sociales actualizadas.");
  }

  return (
    <SettingsSection
      title="Redes sociales"
      description="Dónde vas a publicar tu contenido."
      saving={saving}
      onSave={handleSave}
    >
      <SocialLinksStep value={value} onChange={(p) => setValue((v) => ({ ...v, ...p }))} />
    </SettingsSection>
  );
}
