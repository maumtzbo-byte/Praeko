import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Crea tu cuenta — Praeko" };

export default function RegisterPage() {
  return <RegisterForm />;
}
