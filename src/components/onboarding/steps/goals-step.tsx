import type { GoalsInput } from "@/lib/validation/onboarding";
import { GOAL_OPTIONS } from "@/lib/onboarding/options";
import { OptionCard } from "@/components/ui/option-card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FieldError } from "@/components/ui/field-error";

export function GoalsStep({
  value,
  onChange,
  errors,
}: {
  value: GoalsInput;
  onChange: (patch: Partial<GoalsInput>) => void;
  errors: Partial<Record<keyof GoalsInput, string>>;
}) {
  function toggle(goal: string) {
    const isSelected = value.goals.includes(goal);
    onChange({ goals: isSelected ? value.goals.filter((g) => g !== goal) : [...value.goals, goal] });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {GOAL_OPTIONS.map(({ value: goalValue, label, icon: Icon }) => (
          <OptionCard
            key={goalValue}
            selected={value.goals.includes(goalValue)}
            onClick={() => toggle(goalValue)}
            icon={<Icon className="h-4 w-4" strokeWidth={1.5} />}
            label={label}
          />
        ))}
      </div>
      <FieldError message={errors.goals} />

      {value.goals.includes("otro") && (
        <div>
          <Label htmlFor="ob-goals-other">Cuéntanos cuál</Label>
          <Input id="ob-goals-other" value={value.goalsOther} onChange={(e) => onChange({ goalsOther: e.target.value })} />
        </div>
      )}
    </div>
  );
}
