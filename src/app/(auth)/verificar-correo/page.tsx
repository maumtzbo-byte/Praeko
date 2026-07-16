import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export const metadata: Metadata = { title: "Confirma tu correo — Praeko" };

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailPanel />
    </Suspense>
  );
}
