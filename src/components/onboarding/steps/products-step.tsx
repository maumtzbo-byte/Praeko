import type { ProductsInput } from "@/lib/validation/onboarding";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "@/components/ui/chip-input";
import { FieldError } from "@/components/ui/field-error";

export function ProductsStep({
  value,
  onChange,
  errors,
}: {
  value: ProductsInput;
  onChange: (patch: Partial<ProductsInput>) => void;
  errors: Partial<Record<keyof ProductsInput, string>>;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Label required>¿Qué vende tu negocio?</Label>
        <Textarea
          value={value.sellsDescription}
          onChange={(e) => onChange({ sellsDescription: e.target.value })}
          invalid={!!errors.sellsDescription}
        />
        <FieldError message={errors.sellsDescription} />
      </div>
      <div>
        <Label>Categorías</Label>
        <ChipInput value={value.productCategories} onChange={(v) => onChange({ productCategories: v })} />
      </div>
      <div>
        <Label>Productos principales</Label>
        <ChipInput value={value.mainProducts} onChange={(v) => onChange({ mainProducts: v })} />
      </div>
      <div>
        <Label>Ticket promedio</Label>
        <Input
          value={value.averageTicket}
          onChange={(e) => onChange({ averageTicket: e.target.value })}
          placeholder="$350 MXN por visita"
        />
      </div>
      <div>
        <Label>Promociones frecuentes</Label>
        <Textarea
          value={value.frequentPromotions}
          onChange={(e) => onChange({ frequentPromotions: e.target.value })}
        />
      </div>
    </div>
  );
}
