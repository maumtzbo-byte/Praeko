import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Restablecer contraseña — Praeko" };

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
