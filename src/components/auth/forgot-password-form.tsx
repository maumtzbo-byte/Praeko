"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setFormError(null);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/restablecer-contrasena`,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Revisa tu correo</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="success">
            Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu
            contraseña.
          </Alert>
          <Link
            href="/login"
            className="mt-4 block text-center text-sm font-medium text-zinc-900 underline"
          >
            Volver a iniciar sesión
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Recupera tu contraseña</CardTitle>
        <CardDescription>Te mandamos un enlace a tu correo para restablecerla.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {formError && <Alert variant="error">{formError}</Alert>}

          <div>
            <Label htmlFor="email" required>
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              invalid={!!errors.email}
              {...register("email")}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
            Enviar enlace
          </Button>

          <Link
            href="/login"
            className="text-center text-sm font-medium text-zinc-500 hover:text-zinc-800"
          >
            Volver a iniciar sesión
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
