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
  competitionSchema,
  productsSchema,
  aiInfoSchema,
  TOTAL_ONBOARDING_STEPS,
  type BusinessInfoInput,
  type BrandInfoInput,
  type SocialLinksInput,
  type GoalsInput,
  type CompetitionInput,
  type ProductsInput,
  type AiInfoInput,
} from "@/lib/validation/onboarding";
import {
  saveBusinessInfo,
  saveBrandInfo,
  saveSocialLinks,
  saveGoals,
  saveCompetition,
  saveProducts,
  saveAiInfoAndComplete,
} from "@/app/onboarding/actions";
import { flattenZodErrors } from "@/lib/validation/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepperProgress } from "./stepper-progress";
import { BusinessInfoStep } from "./steps/business-info-step";
import { BrandInfoStep } from "./steps/brand-info-step";
import { SocialLinksStep } from "./steps/social-links-step";
import { GoalsStep } from "./steps/goals-step";
import { CompetitionStep } from "./steps/competition-step";
import { ProductsStep } from "./steps/products-step";
import { AiInfoStep } from "./steps/ai-info-step";

export interface OnboardingWizardInitialData {
  businessId: string | null;
  step: number;
  negocio: BusinessInfoInput;
  marca: BrandInfoInput;
  redes: SocialLinksInput;
  objetivos: GoalsInput;
  competencia: CompetitionInput;
  productos: ProductsInput;
  ia: AiInfoInput;
  logoUrl: string | null;
}

export function OnboardingWizard({ initial }: { initial: OnboardingWizardInitialData }) {
  const router = useRouter();
  const [businessId, setBusinessId] = useState(initial.businessId);
  const [step, setStep] = useState(Math.min(Math.max(initial.step, 1), TOTAL_ONBOARDING_STEPS));
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);

  const [negocio, setNegocio] = useState(initial.negocio);
  const [marca, setMarca] = useState(initial.marca);
  const [redes, setRedes] = useState(initial.redes);
  const [objetivos, setObjetivos] = useState(initial.objetivos);
  const [competencia, setCompetencia] = useState(initial.competencia);
  const [productos, setProductos] = useState(initial.productos);
  const [ia, setIa] = useState(initial.ia);

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
      const parsed = socialLinksSchema.safeParse(redes);
      if (!parsed.success) {
        setErrors(flattenZodErrors(parsed.error));
        return false;
      }
      const res = await saveSocialLinks(businessId, redes);
      if (!res.success) {
        toast.error(res.error);
        return false;
      }
      return true;
    }
    if (step === 4) {
      const parsed = goalsSchema.safeParse(objetivos);
      if (!parsed.success) {
        setErrors(flattenZodErrors(parsed.error));
        return false;
      }
      const res = await saveGoals(businessId, objetivos);
      if (!res.success) {
        toast.error(res.error);
        return false;
      }
      return true;
    }
    if (step === 5) {
      const parsed = competitionSchema.safeParse(competencia);
      if (!parsed.success) {
        setErrors(flattenZodErrors(parsed.error));
        return false;
      }
      const res = await saveCompetition(businessId, competencia);
      if (!res.success) {
        toast.error(res.error);
        return false;
      }
      return true;
    }
    if (step === 6) {
      const parsed = productsSchema.safeParse(productos);
      if (!parsed.success) {
        setErrors(flattenZodErrors(parsed.error));
        return false;
      }
      const res = await saveProducts(businessId, productos);
      if (!res.success) {
        toast.error(res.error);
        return false;
      }
      return true;
    }
    if (step === 7) {
      const parsed = aiInfoSchema.safeParse(ia);
      if (!parsed.success) {
        setErrors(flattenZodErrors(parsed.error));
        return false;
      }
      const res = await saveAiInfoAndComplete(businessId, ia);
      if (!res.success) {
        toast.error(res.error);
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
        toast.success("¡Todo listo! Bienvenido a Praeko.");
        router.push("/dashboard");
        router.refresh();
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <StepperProgress currentStep={step} />
        <CardTitle className="text-xl">
          {step === 1 && "Cuéntanos de tu negocio"}
          {step === 2 && "Tu marca"}
          {step === 3 && "Redes sociales"}
          {step === 4 && "¿Cuáles son tus objetivos?"}
          {step === 5 && "Tu competencia"}
          {step === 6 && "Productos o servicios"}
          {step === 7 && "Información para la IA"}
        </CardTitle>
        <CardDescription>
          {step === 1 && "Lo básico para que Praeko entienda tu negocio."}
          {step === 2 && "Así es como tu marca se ve y se comunica."}
          {step === 3 && "Conecta tus redes para que Praeko sepa dónde publicar."}
          {step === 4 && "Selecciona todos los que apliquen."}
          {step === 5 && "Nos ayuda a diferenciarte en el contenido."}
          {step === 6 && "Lo que ofreces, para que la IA lo represente bien."}
          {step === 7 && "Reglas claras para que la IA nunca se salga de tono."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 1 && (
          <BusinessInfoStep value={negocio} onChange={(p) => setNegocio((v) => ({ ...v, ...p }))} errors={errors} />
        )}
        {step === 2 && (
          <BrandInfoStep
            businessId={businessId}
            value={marca}
            onChange={(p) => setMarca((v) => ({ ...v, ...p }))}
            errors={errors}
            logoUrl={logoUrl}
            onLogoUploaded={setLogoUrl}
          />
        )}
        {step === 3 && <SocialLinksStep value={redes} onChange={(p) => setRedes((v) => ({ ...v, ...p }))} />}
        {step === 4 && (
          <GoalsStep value={objetivos} onChange={(p) => setObjetivos((v) => ({ ...v, ...p }))} errors={errors} />
        )}
        {step === 5 && (
          <CompetitionStep value={competencia} onChange={(p) => setCompetencia((v) => ({ ...v, ...p }))} />
        )}
        {step === 6 && (
          <ProductsStep value={productos} onChange={(p) => setProductos((v) => ({ ...v, ...p }))} errors={errors} />
        )}
        {step === 7 && <AiInfoStep value={ia} onChange={(p) => setIa((v) => ({ ...v, ...p }))} errors={errors} />}

        <div className="mt-8 flex flex-col gap-3 border-t border-zinc-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
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
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveForLater}
              loading={saving}
              className="whitespace-nowrap"
            >
              Guardar para después
            </Button>
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
