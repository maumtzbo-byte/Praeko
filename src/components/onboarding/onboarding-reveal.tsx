"use client";

import { useEffect, useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { generateContentPlan, type GeneratedContentPreview } from "@/app/dashboard/generar-contenido/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const CONTENT_KIND_LABEL: Record<string, string> = {
  video: "Video",
  imagen: "Imagen",
};

/** The reveal screen at the end of onboarding. Generates one real day of
 * content via the (already-working) Claude strategy agent and shows the
 * topic + script as a personalized preview. Deliberately text, not an
 * actual rendered video/image: fal.ai (FalGenerationProvider) is still a
 * stub — every method throws "Not implemented yet" until FAL_API_KEY and
 * the render queue exist. Swapping this preview for a real generated
 * clip later is a small change once that's wired up; this keeps the
 * "wow, personalized" moment honest in the meantime. */
export function OnboardingReveal({ businessId, onFinish }: { businessId: string; onFinish: () => void }) {
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [preview, setPreview] = useState<GeneratedContentPreview | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await generateContentPlan(businessId, 1);
      if (cancelled) return;
      if (!res.success || res.data.preview.length === 0) {
        setState("error");
        return;
      }
      setPreview(res.data.preview[0]);
      setState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  return (
    <Card className="w-full max-w-xl">
      <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)]">
          <Sparkles
            className={`h-6 w-6 text-zinc-600 ${state === "loading" ? "animate-pulse" : ""}`}
            strokeWidth={1.5}
          />
        </span>

        {state === "loading" && (
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-950">
              Generando tu primer contenido…
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Tus agentes de estrategia y guionista están trabajando.</p>
          </div>
        )}

        {state === "ready" && preview && (
          <>
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-950">
                ¡Listo! Así arranca tu primer contenido
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                El guion es real y ya está en tu calendario — el video o imagen se genera desde el dashboard.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-[var(--hairline)] bg-white/70 p-5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_36px_-22px_rgba(0,0,0,0.18)]">
              <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">
                {CONTENT_KIND_LABEL[preview.contentKind] ?? preview.contentKind}
              </p>
              <p className="mt-2 text-base font-semibold text-zinc-900">{preview.topic}</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{preview.script}</p>
            </div>
          </>
        )}

        {state === "error" && (
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-semibold text-zinc-950">
              ¡Todo listo!
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Tu cuenta ya está configurada — genera tu primer contenido desde el dashboard.
            </p>
          </div>
        )}

        <Button onClick={onFinish} size="lg" className="w-full sm:w-auto">
          Comenzar <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
