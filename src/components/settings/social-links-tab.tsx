"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
    toast.success("Menciones actualizadas.");
  }

  return (
    <SettingsSection
      title="Menciones y enlaces"
      description="Tus @usuarios y perfiles — la IA los menciona en el contenido que escribe. Esto no publica nada por sí solo."
      saving={saving}
      onSave={handleSave}
    >
      <Link
        href="/dashboard/redes-sociales"
        className="flex items-center gap-1.5 self-start text-sm text-zinc-500 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-700 "
      >
        ¿Buscas publicar automático? Conecta tus cuentas en Redes sociales
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
      <SocialLinksStep value={value} onChange={(p) => setValue((v) => ({ ...v, ...p }))} />
    </SettingsSection>
  );
}
