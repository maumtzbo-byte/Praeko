"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OAuthButtons, OAuthDivider } from "@/components/auth/oauth-buttons";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered")) {
        setFormError("Ya existe una cuenta con este correo.");
      } else {
        setFormError(error.message);
      }
      return;
    }

    // Supabase returns an empty identities array (no error) when the email
    // is already registered but unconfirmed — surface that instead of a
    // silent "check your email" that looks successful either way.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setFormError("Ya existe una cuenta con este correo.");
      return;
    }

    router.push(`/verificar-correo?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Crea tu cuenta</CardTitle>
        <CardDescription>Empieza a automatizar tu marketing con Frames.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-5">
          <OAuthButtons />
          <OAuthDivider />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 flex flex-col gap-4" noValidate>
          {formError && <Alert variant="error">{formError}</Alert>}

          <div>
            <Label htmlFor="fullName" required>
              Nombre completo
            </Label>
            <Input
              id="fullName"
              autoComplete="name"
              invalid={!!errors.fullName}
              {...register("fullName")}
            />
            <FieldError message={errors.fullName?.message} />
          </div>

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

          <div>
            <Label htmlFor="password" required>
              Contraseña
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
              Confirma tu contraseña
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
            Crear cuenta
          </Button>

          <p className="text-center text-sm text-zinc-500">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-zinc-900 underline">
              Inicia sesión
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
