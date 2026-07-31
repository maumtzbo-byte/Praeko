import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";

export const metadata: Metadata = { title: "Confirma tu correo — Frames" };

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailPanel />
    </Suspense>
  );
}
