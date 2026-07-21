"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  businessInfoSchema,
  brandInfoSchema,
  socialLinksSchema,
  goalsSchema,
  TOTAL_ONBOARDING_STEPS,
  type BusinessInfoInput,
  type BrandInfoInput,
  type SocialLinksInput,
  type GoalsInput,
} from "@/lib/validation/onboarding";
import { saveBusinessInfo, saveBrandInfo, saveSocialLinks, saveGoals, completeOnboarding } from "@/app/onboarding/actions";
import { flattenZodErrors } from "@/lib/validation/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepperProgress } from "./stepper-progress";
import { OnboardingBusinessStep } from "./steps/onboarding-business-step";
import { OnboardingBrandStep } from "./steps/onboarding-brand-step";
import { GoalsStep } from "./steps/goals-step";
import { SocialLinksStep } from "./steps/social-links-step";
import { OnboardingReveal } from "./onboarding-reveal";

export interface OnboardingWizardInitialData {
  businessId: string | null;
  step: number;
  negocio: BusinessInfoInput;
  marca: BrandInfoInput;
  redes: SocialLinksInput;
  objetivos: GoalsInput;
  logoUrl: string | null;
}

export function OnboardingWizard({ initial }: { initial: OnboardingWizardInitialData }) {
  const router = useRouter();
  const [businessId, setBusinessId] = useState(initial.businessId);
  const [step, setStep] = useState(Math.min(Math.max(initial.step, 1), TOTAL_ONBOARDING_STEPS));
  const [phase, setPhase] = useState<"form" | "reveal">("form");
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);

  // País/idioma se guardan con un valor por defecto sensato en vez de
  // preguntarse — siguen siendo campos reales y editables en Configuración,
  // solo dejaron de bloquear el registro.
  const [negocio, setNegocio] = useState<BusinessInfoInput>({
    ...initial.negocio,
    country: initial.negocio.country || "México",
    primaryLanguage: initial.negocio.primaryLanguage || "Español",
  });
  const [marca, setMarca] = useState(initial.marca);
  const [redes, setRedes] = useState(initial.redes);
  const [objetivos, setObjetivos] = useState(initial.objetivos);

  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Validates + persists whatever step is active. Returns whether it succeeded. */
  async function saveCurrentStep(): Promise<boolean> {
    setErrors({});

    if (step === 1) {
      const parsed = businessInfoSchema.safeParse(negocio);
      if (!parsed.success) {
        setErrors(flattenZodErrors(parsed.error));
        return false;
      }
      const res = await saveBusinessInfo(businessId, negocio);
      if (!res.success) {
        toast.error(res.error);
        return false;
      }
      setBusinessId(res.data.businessId);
      return true;
    }

    if (!businessId) {
      toast.error("Falta completar el paso 1.");
      return false;
    }

    if (step === 2) {
      const parsed = brandInfoSchema.safeParse(marca);
      if (!parsed.success) {
        setErrors(flattenZodErrors(parsed.error));
        return false;
      }
      const res = await saveBrandInfo(businessId, marca);
      if (!res.success) {
        toast.error(res.error);
        return false;
      }
      return true;
    }

    if (step === 3) {
      const parsedGoals = goalsSchema.safeParse(objetivos);
      if (!parsedGoals.success) {
        setErrors(flattenZodErrors(parsedGoals.error));
        return false;
      }
      // Redes sociales no tiene campos obligatorios — safeParse aquí solo
      // normaliza los defaults, nunca debería fallar.
      const parsedSocial = socialLinksSchema.safeParse(redes);
      if (!parsedSocial.success) return false;

      const goalsRes = await saveGoals(businessId, objetivos);
      if (!goalsRes.success) {
        toast.error(goalsRes.error);
        return false;
      }
      const socialRes = await saveSocialLinks(businessId, redes);
      if (!socialRes.success) {
        toast.error(socialRes.error);
        return false;
      }
      const completeRes = await completeOnboarding(businessId);
      if (!completeRes.success) {
        toast.error(completeRes.error);
        return false;
      }
      return true;
    }

    return false;
  }

  async function handleContinue() {
    setSaving(true);
    try {
      const ok = await saveCurrentStep();
      if (!ok) return;

      if (step === TOTAL_ONBOARDING_STEPS) {
        setPhase("reveal");
        return;
      }

      setStep((s) => Math.min(s + 1, TOTAL_ONBOARDING_STEPS));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveForLater() {
    setSaving(true);
    try {
      const ok = await saveCurrentStep();
      if (ok) toast.success("Progreso guardado. Puedes continuar cuando quieras.");
    } finally {
      setSaving(false);
    }
  }

  if (phase === "reveal" && businessId) {
    return (
      <OnboardingReveal
        businessId={businessId}
        onFinish={() => {
          router.push("/dashboard");
          router.refresh();
        }}
      />
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <StepperProgress currentStep={step} />
        <CardTitle className="font-[family-name:var(--font-display)] text-xl">
          {step === 1 && "Cuéntanos de tu negocio"}
          {step === 2 && "Tu marca"}
          {step === 3 && "Objetivos y redes"}
        </CardTitle>
        <CardDescription>
          {step === 1 && "Lo esencial para que Praeko entienda tu negocio."}
          {step === 2 && "Así debe sonar tu marca en todo lo que publiquemos."}
          {step === 3 && "Qué quieres lograr, y dónde vas a publicar."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <OnboardingBusinessStep
            value={negocio}
            onChange={(p) => setNegocio((v) => ({ ...v, ...p }))}
            errors={errors}
          />
        )}
        {step === 2 && (
          <OnboardingBrandStep
            businessId={businessId}
            value={marca}
            onChange={(p) => setMarca((v) => ({ ...v, ...p }))}
            errors={errors}
            logoUrl={logoUrl}
            onLogoUploaded={setLogoUrl}
          />
        )}
        {step === 3 && (
          <div className="flex flex-col gap-8">
            <GoalsStep value={objetivos} onChange={(p) => setObjetivos((v) => ({ ...v, ...p }))} errors={errors} />
            <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
              <p className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">Redes sociales (opcional)</p>
              <SocialLinksStep value={redes} onChange={(p) => setRedes((v) => ({ ...v, ...p }))} />
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 1 || saving}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="order-3 sm:order-1"
          >
            <ArrowLeft className="h-4 w-4" /> Atrás
          </Button>

          <div className="order-1 flex flex-col gap-2 sm:order-2 sm:flex-row sm:items-center">
            {step < TOTAL_ONBOARDING_STEPS && (
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveForLater}
                loading={saving}
                className="whitespace-nowrap"
              >
                Guardar para después
              </Button>
            )}
            <Button type="button" onClick={handleContinue} loading={saving}>
              {step === TOTAL_ONBOARDING_STEPS ? "Finalizar" : "Continuar"}
              {step !== TOTAL_ONBOARDING_STEPS && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
