"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UploadCloud, ImageOff } from "lucide-react";
import type { BrandInfoInput } from "@/lib/validation/onboarding";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";

/** Compact, card-first version of the brand-info form used only by the
 * onboarding wizard — just enough for the AI to sound like the business on
 * day one. Configuración keeps the full BrandInfoStep (colores, tipografía,
 * valores, misión) for editing later. */
export function OnboardingBrandStep({
  businessId,
  value,
  onChange,
  errors,
  logoUrl,
  onLogoUploaded,
}: {
  businessId: string | null;
  value: BrandInfoInput;
  onChange: (patch: Partial<BrandInfoInput>) => void;
  errors: Partial<Record<keyof BrandInfoInput, string>>;
  logoUrl: string | null;
  onLogoUploaded: (path: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleLogoSelect(file: File | undefined) {
    if (!file || !businessId) {
      if (!businessId) toast.error("Completa el paso anterior antes de subir tu logo.");
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const path = `${businessId}/logo/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("brand-assets").upload(path, file, {
      upsert: true,
    });
    if (uploadError) {
      toast.error("No se pudo subir el logo: " + uploadError.message);
      setUploading(false);
      return;
    }
    const { error: recordError } = await supabase
      .from("brand_assets")
      .insert({ business_id: businessId, asset_type: "logo", storage_path: path });
    setUploading(false);
    if (recordError) {
      toast.error("Logo subido, pero no se pudo registrar: " + recordError.message);
      return;
    }
    onLogoUploaded(path);
    toast.success("Logo subido.");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Label htmlFor="ob-brand-tone" required>¿Cómo debe sonar tu marca?</Label>
        <Textarea
          id="ob-brand-tone"
          value={value.brandTone}
          onChange={(e) => onChange({ brandTone: e.target.value })}
          invalid={!!errors.brandTone}
          placeholder="Cercano y directo, formal y experto, divertido…"
        />
        <FieldError message={errors.brandTone} />
      </div>

      <div>
        <Label htmlFor="ob-target-audience" required>¿A quién le hablas?</Label>
        <Textarea
          id="ob-target-audience"
          value={value.targetAudience}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          invalid={!!errors.targetAudience}
          placeholder="Mujeres 25-40, profesionistas en Ciudad de México…"
        />
        <FieldError message={errors.targetAudience} />
      </div>

      <div>
        <Label>Logo (opcional)</Label>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-[var(--hairline)] bg-white px-4 py-6 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)_inset] hover:border-zinc-300 ">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo del negocio" className="h-14 w-14 rounded-xl object-cover" />
          ) : uploading ? (
            <UploadCloud className="h-5 w-5 animate-pulse text-zinc-400" />
          ) : (
            <ImageOff className="h-5 w-5 text-zinc-400" />
          )}
          <span className="text-sm text-zinc-500">
            {uploading ? "Subiendo…" : logoUrl ? "Cambiar logo" : "Sube el logo de tu negocio"}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="hidden"
            onChange={(e) => handleLogoSelect(e.target.files?.[0])}
          />
        </label>
      </div>
    </div>
  );
}
