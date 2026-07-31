import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Crea tu cuenta — Frames" };

export default function RegisterPage() {
  return <RegisterForm />;
}
