import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PERIODOS, type Periodo } from '@/lib/date-ranges'

export function PeriodSelector({ value, onChange }: { value: Periodo; onChange: (value: Periodo) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Periodo)}>
      <SelectTrigger className="w-full sm:w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIODOS.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
