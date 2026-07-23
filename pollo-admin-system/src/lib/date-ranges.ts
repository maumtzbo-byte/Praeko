import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  endOfDay,
  format,
} from 'date-fns'
import { es } from 'date-fns/locale'

export type Periodo = 'dia' | 'semana' | 'mes' | 'anio'

export const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'dia', label: 'Día' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'anio', label: 'Año' },
]

export function getRangoPeriodo(periodo: Periodo, referencia = new Date()): { desde: string; hasta: string } {
  const hasta = endOfDay(referencia)
  let desde: Date

  switch (periodo) {
    case 'dia':
      desde = startOfDay(subDays(referencia, 13))
      break
    case 'semana':
      desde = startOfWeek(subWeeks(referencia, 7), { weekStartsOn: 1 })
      break
    case 'mes':
      desde = startOfMonth(subMonths(referencia, 11))
      break
    case 'anio':
      desde = startOfYear(subYears(referencia, 4))
      break
  }

  return { desde: format(desde, 'yyyy-MM-dd'), hasta: format(hasta, 'yyyy-MM-dd') }
}

export function formatEtiquetaPeriodo(periodo: Periodo, fecha: string): string {
  const date = new Date(`${fecha}T00:00:00`)
  switch (periodo) {
    case 'dia':
      return format(date, 'd MMM', { locale: es })
    case 'semana':
      return format(date, "'sem.' w", { locale: es })
    case 'mes':
      return format(date, 'MMM yy', { locale: es })
    case 'anio':
      return format(date, 'yyyy', { locale: es })
  }
}

export function agruparPorPeriodo<T extends { fecha: string }>(
  registros: T[],
  periodo: Periodo,
): Record<string, T[]> {
  const grupos: Record<string, T[]> = {}
  for (const registro of registros) {
    const date = new Date(`${registro.fecha}T00:00:00`)
    let clave: string
    switch (periodo) {
      case 'dia':
        clave = registro.fecha
        break
      case 'semana':
        clave = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        break
      case 'mes':
        clave = format(startOfMonth(date), 'yyyy-MM-dd')
        break
      case 'anio':
        clave = format(startOfYear(date), 'yyyy-MM-dd')
        break
    }
    if (!grupos[clave]) grupos[clave] = []
    grupos[clave].push(registro)
  }
  return grupos
}
