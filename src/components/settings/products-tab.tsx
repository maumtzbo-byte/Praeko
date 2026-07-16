"use client";

import { useState } from "react";
import { toast } from "sonner";
import { productsSchema, type ProductsInput } from "@/lib/validation/onboarding";
import { flattenZodErrors } from "@/lib/validation/utils";
import { saveProducts } from "@/app/onboarding/actions";
import { ProductsStep } from "@/components/onboarding/steps/products-step";
import { SettingsSection } from "./settings-section";

export function ProductsTab({ businessId, initial }: { businessId: string; initial: ProductsInput }) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductsInput, string>>>({});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setErrors({});
    const parsed = productsSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setSaving(true);
    const res = await saveProducts(businessId, value);
    setSaving(false);
    if (!res.success) return toast.error(res.error);
    toast.success("Productos y servicios actualizados.");
  }

  return (
    <SettingsSection
      title="Productos o servicios"
      description="Lo que ofreces, para que la IA lo represente bien."
      saving={saving}
      onSave={handleSave}
    >
      <ProductsStep value={value} onChange={(p) => setValue((v) => ({ ...v, ...p }))} errors={errors} />
    </SettingsSection>
  );
}
