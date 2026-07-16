"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ResetPasswordForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      setFormError(error.message);
      return;
    }

    router.push("/login");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Elige una nueva contraseña</CardTitle>
        <CardDescription>Tu enlace de recuperación ya fue verificado.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {formError && <Alert variant="error">{formError}</Alert>}

          <div>
            <Label htmlFor="password" required>
              Nueva contraseña
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <div>
            <Label htmlFor="confirmPassword" required>
              Confirma tu nueva contraseña
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              invalid={!!errors.confirmPassword}
              {...register("confirmPassword")}
            />
            <FieldError message={errors.confirmPassword?.message} />
          </div>

          <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
            Guardar nueva contraseña
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
