import Link from "next/link";
import { Bot, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/dashboard/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans/limits";

export default async function IaMarketingPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const [{ data: brandProfile }, { data: subscription }] = await Promise.all([
    supabase.from("brand_profiles").select("*").eq("business_id", business.id).maybeSingle(),
    supabase.from("subscriptions").select("plan_key").eq("business_id", business.id).maybeSingle(),
  ]);

  const editAction = (
    <Link href="/dashboard/configuracion?tab=ia">
      <Button variant="secondary" size="sm">
        <Pencil className="h-3.5 w-3.5" /> Editar reglas de la IA
      </Button>
    </Link>
  );

  const planKey = subscription?.plan_key as PlanKey | undefined;
  const plan = planKey ? PLAN_LIMITS[planKey] : null;
  const modelLabel = plan?.contentModel === "claude-opus-4-8" ? "Claude Opus 4.8" : "Claude Sonnet 5";

  const modelCard = (
    <Card className="mb-6 bg-white/70">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-wide text-zinc-500">MODELO DE IA ACTIVO</p>
          <p className="mt-1 text-sm text-zinc-600">
            {plan
              ? `Tu plan ${plan.displayName} genera contenido con ${modelLabel}.`
              : "Todavía no tienes un plan activo — elige uno para ver qué modelo de IA usa tu contenido."}
          </p>
        </div>
        {!plan && (
          <Link href="/dashboard/plan">
            <Button variant="secondary" size="sm">
              Elegir plan
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );

  if (!brandProfile) {
    return (
      <div>
        <PageHeader title="IA de Marketing" description="Cómo se comportan tus agentes de IA." actions={editAction} />
        {modelCard}
        <EmptyState
          icon={Bot}
          title="Todavía no hay reglas configuradas"
          description="Completa el paso de información para la IA en tu configuración para que tus agentes nunca se salgan de tono."
        />
      </div>
    );
  }

  const faqs = (brandProfile.faqs ?? []) as { question: string; answer: string }[];
  const businessHours = (brandProfile.business_hours ?? {}) as { general?: string };

  return (
    <div>
      <PageHeader title="IA de Marketing" description="Cómo se comportan tus agentes de IA." actions={editAction} />
      {modelCard}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personalidad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">{brandProfile.personality || "Sin definir todavía."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estilo de respuesta</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">{brandProfile.ai_response_style || "Sin definir todavía."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temas prohibidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">{brandProfile.ai_forbidden_topics || "Sin definir todavía."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Palabras prohibidas</CardTitle>
          </CardHeader>
          <CardContent>
            {brandProfile.ai_forbidden_words.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {brandProfile.ai_forbidden_words.map((word) => (
                  <Badge key={word} variant="danger">
                    {word}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Sin palabras prohibidas.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horario de atención</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">{businessHours.general || "Sin definir todavía."}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dirección</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600">{brandProfile.address || "Sin definir todavía."}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Preguntas frecuentes</CardTitle>
          </CardHeader>
          <CardContent>
            {faqs.length > 0 ? (
              <div className="flex flex-col divide-y divide-zinc-100">
                {faqs.map((faq, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium text-zinc-900">{faq.question}</p>
                    <p className="mt-1 text-sm text-zinc-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Sin preguntas frecuentes definidas.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {brandProfile.additional_info && (
        <div className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Información adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600">{brandProfile.additional_info}</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
