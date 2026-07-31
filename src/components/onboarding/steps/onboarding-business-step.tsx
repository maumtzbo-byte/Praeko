import type { BusinessInfoInput } from "@/lib/validation/onboarding";
import { INDUSTRY_OPTIONS } from "@/lib/onboarding/options";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { OptionCard } from "@/components/ui/option-card";

/** Compact, card-first version of the business-info form used only by the
 * onboarding wizard — shows only what the AI genuinely needs to generate a
 * first piece of content. Configuración keeps the full BusinessInfoStep
 * (país, idioma, teléfono, sitio web) for editing later. */
export function OnboardingBusinessStep({
  value,
  onChange,
  errors,
}: {
  value: BusinessInfoInput;
  onChange: (patch: Partial<BusinessInfoInput>) => void;
  errors: Partial<Record<keyof BusinessInfoInput, string>>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Label id="ob-industry-label" required>¿A qué te dedicas?</Label>
        <div role="group" aria-labelledby="ob-industry-label" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {INDUSTRY_OPTIONS.map(({ value: opt, label, icon: Icon }) => (
            <OptionCard
              key={opt}
              selected={value.industry === opt}
              onClick={() => onChange({ industry: opt })}
              icon={<Icon className="h-4 w-4" strokeWidth={1.5} />}
              label={label}
              className="p-3"
            />
          ))}
        </div>
        <FieldError message={errors.industry} />
      </div>

      <div>
        <Label htmlFor="ob-business-name" required>Nombre del negocio</Label>
        <Input
          id="ob-business-name"
          value={value.name}
          onChange={(e) => onChange({ name: e.target.value })}
          invalid={!!errors.name}
        />
        <FieldError message={errors.name} />
      </div>

      <div>
        <Label htmlFor="ob-business-description" required>¿Qué hace tu negocio?</Label>
        <Textarea
          id="ob-business-description"
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          invalid={!!errors.description}
          placeholder="En una o dos frases — qué ofreces y qué te hace distinto."
        />
        <FieldError message={errors.description} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="ob-city" required>Ciudad</Label>
          <Input id="ob-city" value={value.city} onChange={(e) => onChange({ city: e.target.value })} invalid={!!errors.city} />
          <FieldError message={errors.city} />
        </div>
        <div>
          <Label htmlFor="ob-contact-email" required>Correo de contacto</Label>
          <Input
            id="ob-contact-email"
            type="email"
            value={value.contactEmail}
            onChange={(e) => onChange({ contactEmail: e.target.value })}
            invalid={!!errors.contactEmail}
          />
          <FieldError message={errors.contactEmail} />
        </div>
      </div>
    </div>
  );
}
