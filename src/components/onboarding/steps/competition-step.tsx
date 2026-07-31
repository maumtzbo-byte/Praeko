import type { CompetitionInput } from "@/lib/validation/onboarding";
import { Label } from "@/components/ui/label";
import { ChipInput } from "@/components/ui/chip-input";

export function CompetitionStep({
  value,
  onChange,
}: {
  value: CompetitionInput;
  onChange: (patch: Partial<CompetitionInput>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Label htmlFor="comp-main-competitors">Principales competidores</Label>
        <ChipInput
          id="comp-main-competitors"
          value={value.mainCompetitors}
          onChange={(v) => onChange({ mainCompetitors: v })}
          placeholder="Nombre del negocio y presiona Enter"
        />
      </div>
      <div>
        <Label htmlFor="comp-admired-companies">Empresas que admiras</Label>
        <ChipInput
          id="comp-admired-companies"
          value={value.admiredCompanies}
          onChange={(v) => onChange({ admiredCompanies: v })}
          placeholder="Marcas que te inspiran"
        />
      </div>
      <div>
        <Label htmlFor="comp-style-references">Referencias de estilo</Label>
        <ChipInput
          id="comp-style-references"
          value={value.styleReferences}
          onChange={(v) => onChange({ styleReferences: v })}
          placeholder="Cuentas o estilos visuales que te gustan"
        />
      </div>
    </div>
  );
}
