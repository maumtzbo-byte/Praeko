import type { BusinessInfoInput } from "@/lib/validation/onboarding";
import { INDUSTRY_OPTIONS, LANGUAGE_OPTIONS } from "@/lib/onboarding/options";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";

export function BusinessInfoStep({
  value,
  onChange,
  errors,
}: {
  value: BusinessInfoInput;
  onChange: (patch: Partial<BusinessInfoInput>) => void;
  errors: Partial<Record<keyof BusinessInfoInput, string>>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label required>Nombre del negocio</Label>
        <Input value={value.name} onChange={(e) => onChange({ name: e.target.value })} invalid={!!errors.name} />
        <FieldError message={errors.name} />
      </div>

      <div className="sm:col-span-2">
        <Label required>Descripción</Label>
        <Textarea
          value={value.description}
          onChange={(e) => onChange({ description: e.target.value })}
          invalid={!!errors.description}
          placeholder="¿Qué hace tu negocio y qué lo hace especial?"
        />
        <FieldError message={errors.description} />
      </div>

      <div>
        <Label required>Industria o giro</Label>
        <Select value={value.industry} onChange={(e) => onChange({ industry: e.target.value })} invalid={!!errors.industry}>
          <option value="">Selecciona una opción</option>
          {INDUSTRY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
        <FieldError message={errors.industry} />
      </div>

      <div>
        <Label required>Idioma principal</Label>
        <Select
          value={value.primaryLanguage}
          onChange={(e) => onChange({ primaryLanguage: e.target.value })}
          invalid={!!errors.primaryLanguage}
        >
          <option value="">Selecciona una opción</option>
          {LANGUAGE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Select>
        <FieldError message={errors.primaryLanguage} />
      </div>

      <div>
        <Label required>País</Label>
        <Input value={value.country} onChange={(e) => onChange({ country: e.target.value })} invalid={!!errors.country} />
        <FieldError message={errors.country} />
      </div>

      <div>
        <Label required>Ciudad</Label>
        <Input value={value.city} onChange={(e) => onChange({ city: e.target.value })} invalid={!!errors.city} />
        <FieldError message={errors.city} />
      </div>

      <div>
        <Label>Sitio web</Label>
        <Input
          value={value.websiteUrl}
          onChange={(e) => onChange({ websiteUrl: e.target.value })}
          invalid={!!errors.websiteUrl}
          placeholder="https://tunegocio.com"
        />
        <FieldError message={errors.websiteUrl} />
      </div>

      <div>
        <Label required>Teléfono</Label>
        <Input value={value.phone} onChange={(e) => onChange({ phone: e.target.value })} invalid={!!errors.phone} />
        <FieldError message={errors.phone} />
      </div>

      <div className="sm:col-span-2">
        <Label required>Correo de contacto</Label>
        <Input
          type="email"
          value={value.contactEmail}
          onChange={(e) => onChange({ contactEmail: e.target.value })}
          invalid={!!errors.contactEmail}
        />
        <FieldError message={errors.contactEmail} />
      </div>
    </div>
  );
}
