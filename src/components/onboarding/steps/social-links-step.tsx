import { Plus, X } from "lucide-react";
import type { SocialLinksInput } from "@/lib/validation/onboarding";
import { SOCIAL_PLATFORMS } from "@/lib/onboarding/options";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SocialLinksStep({
  value,
  onChange,
}: {
  value: SocialLinksInput;
  onChange: (patch: Partial<SocialLinksInput>) => void;
}) {
  function updateOther(index: number, patch: Partial<{ label: string; url: string }>) {
    const next = value.other.map((row, i) => (i === index ? { ...row, ...patch } : row));
    onChange({ other: next });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SOCIAL_PLATFORMS.map((platform) => (
          <div key={platform.key}>
            <Label htmlFor={`ob-social-${platform.key}`}>{platform.label}</Label>
            <Input
              id={`ob-social-${platform.key}`}
              value={value[platform.key]}
              onChange={(e) => onChange({ [platform.key]: e.target.value } as Partial<SocialLinksInput>)}
              placeholder={platform.placeholder}
            />
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className="mb-0">Otras plataformas</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ other: [...value.other, { label: "", url: "" }] })}
          >
            <Plus className="h-4 w-4" /> Añadir
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {value.other.map((row, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={row.label}
                onChange={(e) => updateOther(i, { label: e.target.value })}
                placeholder="Plataforma"
                aria-label="Nombre de la plataforma"
                className="w-1/3"
              />
              <Input
                value={row.url}
                onChange={(e) => updateOther(i, { url: e.target.value })}
                placeholder="URL o usuario"
                aria-label="URL o usuario"
              />
              <button
                type="button"
                onClick={() => onChange({ other: value.other.filter((_, idx) => idx !== i) })}
                className="text-zinc-400 hover:text-zinc-700 "
                aria-label="Quitar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
