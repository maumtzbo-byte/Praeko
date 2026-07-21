"use client";

import { useState } from "react";
import { UploadCloud, ImageOff } from "lucide-react";
import type { BrandInfoInput } from "@/lib/validation/onboarding";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "@/components/ui/chip-input";
import { FieldError } from "@/components/ui/field-error";
import { toast } from "sonner";

export function BrandInfoStep({
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
    <div className="flex flex-col gap-5">
      <div>
        <Label>Logo</Label>
        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo del negocio" className="h-16 w-16 rounded-xl object-cover" />
          ) : uploading ? (
            <UploadCloud className="h-6 w-6 animate-pulse text-zinc-400 dark:text-zinc-500" />
          ) : (
            <ImageOff className="h-6 w-6 text-zinc-400 dark:text-zinc-500" />
          )}
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {uploading ? "Subiendo…" : logoUrl ? "Cambiar logo" : "Sube el logo de tu negocio (PNG o JPG)"}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="hidden"
            onChange={(e) => handleLogoSelect(e.target.files?.[0])}
          />
        </label>
      </div>

      <div>
        <Label>Colores principales</Label>
        <ChipInput
          value={value.colorPalette}
          onChange={(v) => onChange({ colorPalette: v })}
          placeholder="#0F172A, azul marino…"
        />
      </div>

      <div>
        <Label>Tipografía (si existe)</Label>
        <ChipInput
          value={value.preferredFonts}
          onChange={(v) => onChange({ preferredFonts: v })}
          placeholder="Montserrat, Helvetica…"
        />
      </div>

      <div>
        <Label required>Tono de comunicación</Label>
        <Textarea
          value={value.brandTone}
          onChange={(e) => onChange({ brandTone: e.target.value })}
          invalid={!!errors.brandTone}
          placeholder="Cercano y directo, formal y experto, divertido…"
        />
        <FieldError message={errors.brandTone} />
      </div>

      <div>
        <Label>Valores de la marca</Label>
        <ChipInput
          value={value.brandValues}
          onChange={(v) => onChange({ brandValues: v })}
          placeholder="Cercanía, calidad, innovación…"
        />
      </div>

      <div>
        <Label required>Misión</Label>
        <Textarea value={value.mission} onChange={(e) => onChange({ mission: e.target.value })} invalid={!!errors.mission} />
        <FieldError message={errors.mission} />
      </div>

      <div>
        <Label required>Público objetivo</Label>
        <Textarea
          value={value.targetAudience}
          onChange={(e) => onChange({ targetAudience: e.target.value })}
          invalid={!!errors.targetAudience}
          placeholder="Mujeres 25-40, profesionistas en Ciudad de México…"
        />
        <FieldError message={errors.targetAudience} />
      </div>
    </div>
  );
}
