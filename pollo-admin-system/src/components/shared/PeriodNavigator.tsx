import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { avanzarUnPeriodo, esPeriodoVigente, formatRangoNavegacion, retrocederUnPeriodo, tieneNavegacion, type Periodo } from '@/lib/date-ranges'

export function PeriodNavigator({
  periodo,
  referencia,
  onChange,
}: {
  periodo: Periodo
  referencia: Date
  onChange: (fecha: Date) => void
}) {
  if (!tieneNavegacion(periodo)) return null

  const esVigente = esPeriodoVigente(periodo, referencia)

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => onChange(retrocederUnPeriodo(periodo, referencia))}
        aria-label="Periodo anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-28 text-center text-sm font-medium capitalize">
        {formatRangoNavegacion(periodo, referencia)}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => onChange(avanzarUnPeriodo(periodo, referencia))}
        disabled={esVigente}
        aria-label="Periodo siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
