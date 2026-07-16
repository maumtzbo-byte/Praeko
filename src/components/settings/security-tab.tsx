"use client";

import { useState } from "react";
import { toast } from "sonner";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { flattenZodErrors } from "@/lib/validation/utils";
import { changePassword } from "@/app/dashboard/configuracion/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { SettingsSection } from "./settings-section";

const emptyForm: ResetPasswordInput = { password: "", confirmPassword: "" };

export function SecurityTab() {
  const [value, setValue] = useState(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ResetPasswordInput, string>>>({});
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setErrors({});
    const parsed = resetPasswordSchema.safeParse(value);
    if (!parsed.success) {
      setErrors(flattenZodErrors(parsed.error));
      return;
    }
    setSaving(true);
    const res = await changePassword(value.password);
    setSaving(false);
    if (!res.success) return toast.error(res.error);
    setValue(emptyForm);
    toast.success("Contraseña actualizada.");
  }

  return (
    <SettingsSection title="Seguridad" description="Cambia tu contraseña." saving={saving} onSave={handleSave}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label required>Nueva contraseña</Label>
          <Input
            type="password"
            value={value.password}
            onChange={(e) => setValue((v) => ({ ...v, password: e.target.value }))}
            invalid={!!errors.password}
            autoComplete="new-password"
          />
          <FieldError message={errors.password} />
        </div>
        <div>
          <Label required>Confirma la nueva contraseña</Label>
          <Input
            type="password"
            value={value.confirmPassword}
            onChange={(e) => setValue((v) => ({ ...v, confirmPassword: e.target.value }))}
            invalid={!!errors.confirmPassword}
            autoComplete="new-password"
          />
          <FieldError message={errors.confirmPassword} />
        </div>
      </div>
    </SettingsSection>
  );
}
