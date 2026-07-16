"use client";

import { useState } from "react";
import { toast } from "sonner";
import { competitionSchema, type CompetitionInput } from "@/lib/validation/onboarding";
import { saveCompetition } from "@/app/onboarding/actions";
import { CompetitionStep } from "@/components/onboarding/steps/competition-step";
import { SettingsSection } from "./settings-section";

export function CompetitionTab({ businessId, initial }: { businessId: string; initial: CompetitionInput }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const parsed = competitionSchema.safeParse(value);
    if (!parsed.success) return;
    setSaving(true);
    const res = await saveCompetition(businessId, value);
    setSaving(false);
    if (!res.success) return toast.error(res.error);
    toast.success("Competencia actualizada.");
  }

  return (
    <SettingsSection title="Competencia" description="Nos ayuda a diferenciarte." saving={saving} onSave={handleSave}>
      <CompetitionStep value={value} onChange={(p) => setValue((v) => ({ ...v, ...p }))} />
    </SettingsSection>
  );
}
