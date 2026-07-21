import { Plus, X } from "lucide-react";
import type { AiInfoInput } from "@/lib/validation/onboarding";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChipInput } from "@/components/ui/chip-input";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";

export function AiInfoStep({
  value,
  onChange,
  errors,
}: {
  value: AiInfoInput;
  onChange: (patch: Partial<AiInfoInput>) => void;
  errors: Partial<Record<keyof AiInfoInput, string>>;
}) {
  function updateFaq(index: number, patch: Partial<{ question: string; answer: string }>) {
    onChange({ faqs: value.faqs.map((f, i) => (i === index ? { ...f, ...patch } : f)) });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Label required>Personalidad de la marca</Label>
        <Textarea
          value={value.personality}
          onChange={(e) => onChange({ personality: e.target.value })}
          invalid={!!errors.personality}
          placeholder="Cómo debe 'sonar' tu marca al hablar con clientes"
        />
        <FieldError message={errors.personality} />
      </div>

      <div>
        <Label required>Cómo debe responder la IA</Label>
        <Textarea
          value={value.aiResponseStyle}
          onChange={(e) => onChange({ aiResponseStyle: e.target.value })}
          invalid={!!errors.aiResponseStyle}
          placeholder="Ej. siempre cercano, nunca usar emojis, respuestas cortas…"
        />
        <FieldError message={errors.aiResponseStyle} />
      </div>

      <div>
        <Label>Qué debe evitar decir</Label>
        <Textarea value={value.aiForbiddenTopics} onChange={(e) => onChange({ aiForbiddenTopics: e.target.value })} />
      </div>

      <div>
        <Label>Palabras prohibidas</Label>
        <ChipInput value={value.aiForbiddenWords} onChange={(v) => onChange({ aiForbiddenWords: v })} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label className="mb-0">Preguntas frecuentes</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange({ faqs: [...value.faqs, { question: "", answer: "" }] })}
          >
            <Plus className="h-4 w-4" /> Añadir
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          {value.faqs.map((faq, i) => (
            <div key={i} className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-3 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <Input
                  value={faq.question}
                  onChange={(e) => updateFaq(i, { question: e.target.value })}
                  placeholder="Pregunta"
                />
                <button
                  type="button"
                  onClick={() => onChange({ faqs: value.faqs.filter((_, idx) => idx !== i) })}
                  className="text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
                  aria-label="Quitar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                value={faq.answer}
                onChange={(e) => updateFaq(i, { answer: e.target.value })}
                placeholder="Respuesta"
                className="min-h-[70px]"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Horarios</Label>
        <Input
          value={value.businessHours}
          onChange={(e) => onChange({ businessHours: e.target.value })}
          placeholder="Lun-vie 9am-7pm, sáb 9am-2pm"
        />
      </div>

      <div>
        <Label>Dirección</Label>
        <Input value={value.address} onChange={(e) => onChange({ address: e.target.value })} />
      </div>

      <div>
        <Label>Información adicional</Label>
        <Textarea value={value.additionalInfo} onChange={(e) => onChange({ additionalInfo: e.target.value })} />
      </div>
    </div>
  );
}
