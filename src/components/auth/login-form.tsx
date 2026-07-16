"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field-error";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    setNeedsVerification(false);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setNeedsVerification(true);
      } else if (error.message.toLowerCase().includes("invalid login credentials")) {
        setFormError("Correo o contraseña incorrectos.");
      } else {
        setFormError(error.message);
      }
      return;
    }

    const next = searchParams.get("next") || "/dashboard";
    router.push(next);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Inicia sesión</CardTitle>
        <CardDescription>Entra a tu cuenta de Praeko.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {formError && <Alert variant="error">{formError}</Alert>}
          {needsVerification && (
            <Alert variant="info">
              Tu correo aún no está verificado.{" "}
              <Link href="/verificar-correo" className="font-medium underline">
                Reenviar verificación
              </Link>
            </Alert>
          )}

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
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>
                Contraseña
              </Label>
              <Link
                href="/recuperar-contrasena"
                className="mb-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              invalid={!!errors.password}
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
            Iniciar sesión
          </Button>

          <p className="text-center text-sm text-zinc-500">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-zinc-900 underline">
              Regístrate
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
