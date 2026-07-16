"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [loading, setLoading] = useState(false);

  async function resend() {
    if (!email) return;
    setLoading(true);
    setStatus("idle");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);
    setStatus(error ? "error" : "sent");
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
          <MailCheck className="h-6 w-6 text-zinc-700" strokeWidth={1.5} />
        </span>
        <CardTitle className="text-xl">Confirma tu correo</CardTitle>
        <CardDescription>
          {email ? (
            <>
              Te enviamos un enlace de confirmación a <strong>{email}</strong>.
            </>
          ) : (
            "Te enviamos un enlace de confirmación a tu correo."
          )}{" "}
          Ábrelo para activar tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {status === "sent" && (
          <Alert variant="success">Te reenviamos el correo de confirmación.</Alert>
        )}
        {status === "error" && (
          <Alert variant="error">No pudimos reenviar el correo. Intenta de nuevo.</Alert>
        )}
        <Button variant="secondary" onClick={resend} loading={loading} disabled={!email}>
          Reenviar correo de confirmación
        </Button>
      </CardContent>
    </Card>
  );
}
