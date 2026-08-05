import {
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  startOfYear,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  endOfDay,
  format,
} from 'date-fns'
import { es } from 'date-fns/locale'

export type Periodo = 'dia' | 'semana' | 'mes' | 'anio' | 'total'

/** Fecha de referencia para "Total": más atrás de cualquier dato real posible. */
const INICIO_TIEMPOS = new Date(2000, 0, 1)

export const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'dia', label: 'Hoy' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mes' },
  { value: 'anio', label: 'Año' },
  { value: 'total', label: 'Total' },
]

/** Periodos donde tiene sentido navegar hacia atrás/adelante a un periodo específico. */
export function tieneNavegacion(periodo: Periodo): boolean {
  return periodo === 'semana' || periodo === 'mes' || periodo === 'anio'
}

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
    case 'total':
      desde = INICIO_TIEMPOS
      break
  }

  return { desde: format(desde, 'yyyy-MM-dd'), hasta: format(hasta, 'yyyy-MM-dd') }
}

/** Inicio del periodo en curso: hoy / esta semana / este mes / este año / siempre. */
function inicioDePeriodo(periodo: Periodo, referencia: Date): Date {
  switch (periodo) {
    case 'dia':
      return startOfDay(referencia)
    case 'semana':
      return startOfWeek(referencia, { weekStartsOn: 1 })
    case 'mes':
      return startOfMonth(referencia)
    case 'anio':
      return startOfYear(referencia)
    case 'total':
      return INICIO_TIEMPOS
  }
}

/** Retrocede exactamente una unidad del periodo (1 día / 1 semana / 1 mes / 1 año). */
export function retrocederUnPeriodo(periodo: Periodo, fecha: Date): Date {
  switch (periodo) {
    case 'dia':
      return subDays(fecha, 1)
    case 'semana':
      return subWeeks(fecha, 1)
    case 'mes':
      return subMonths(fecha, 1)
    case 'anio':
      return subYears(fecha, 1)
    case 'total':
      return fecha
  }
}

/** Avanza exactamente una unidad del periodo (1 día / 1 semana / 1 mes / 1 año). */
export function avanzarUnPeriodo(periodo: Periodo, fecha: Date): Date {
  switch (periodo) {
    case 'dia':
      return addDays(fecha, 1)
    case 'semana':
      return addWeeks(fecha, 1)
    case 'mes':
      return addMonths(fecha, 1)
    case 'anio':
      return addYears(fecha, 1)
    case 'total':
      return fecha
  }
}

/** True si la referencia cae dentro del periodo vigente (no se puede avanzar más). */
export function esPeriodoVigente(periodo: Periodo, referencia: Date): boolean {
  return inicioDePeriodo(periodo, referencia).getTime() === inicioDePeriodo(periodo, new Date()).getTime()
}

/** Etiqueta del periodo específico que se está navegando, ej. "Agosto 2026". */
export function formatRangoNavegacion(periodo: Periodo, referencia: Date): string {
  switch (periodo) {
    case 'semana': {
      const inicio = startOfWeek(referencia, { weekStartsOn: 1 })
      const fin = endOfWeek(referencia, { weekStartsOn: 1 })
      return `${format(inicio, 'd MMM', { locale: es })} – ${format(fin, 'd MMM yyyy', { locale: es })}`
    }
    case 'mes':
      return format(referencia, 'MMMM yyyy', { locale: es })
    case 'anio':
      return format(referencia, 'yyyy', { locale: es })
    default:
      return ''
  }
}

/**
 * El periodo EN CURSO (no una ventana móvil): hoy, esta semana, este mes,
 * este año, o siempre. Es lo que suman las tarjetas del dashboard, para que
 * las cifras sí cambien al mover el selector.
 */
export function getRangoActual(periodo: Periodo, referencia = new Date()): { desde: string; hasta: string } {
  return {
    desde: format(inicioDePeriodo(periodo, referencia), 'yyyy-MM-dd'),
    hasta: format(referencia, 'yyyy-MM-dd'),
  }
}

/**
 * El mismo tramo del periodo anterior, para comparar peras con peras: si hoy
 * es día 8 del mes, compara los días 1-8 de este mes contra los días 1-8 del
 * mes pasado (no contra el mes pasado completo, que siempre saldría mayor).
 * "Total" no tiene periodo anterior con qué comparar.
 */
export function getRangoAnterior(periodo: Periodo, referencia = new Date()): { desde: string; hasta: string } {
  if (periodo === 'total') return { desde: '9999-12-31', hasta: '9999-12-31' }
  const referenciaAnterior = retrocederUnPeriodo(periodo, referencia)
  return {
    desde: format(inicioDePeriodo(periodo, referenciaAnterior), 'yyyy-MM-dd'),
    hasta: format(referenciaAnterior, 'yyyy-MM-dd'),
  }
}

/** Etiquetas para que quede claro qué se está viendo y contra qué se compara. */
export const PERIODO_ACTUAL_LABELS: Record<Periodo, string> = {
  dia: 'Hoy',
  semana: 'Esta semana',
  mes: 'Este mes',
  anio: 'Este año',
  total: 'Todo el tiempo',
}

export const PERIODO_ANTERIOR_LABELS: Record<Periodo, string> = {
  dia: 'vs. ayer',
  semana: 'vs. semana pasada',
  mes: 'vs. mes pasado',
  anio: 'vs. año pasado',
  total: '',
}

/** Se muestra cuando no hay con qué comparar, para que no parezca un error. */
export const PERIODO_SIN_COMPARACION_LABELS: Record<Periodo, string> = {
  dia: 'Sin datos de ayer para comparar',
  semana: 'Sin datos de la semana pasada',
  mes: 'Sin datos del mes pasado',
  anio: 'Sin datos del año pasado',
  total: '',
}

/** Filtra registros por rango de fechas (las fechas ISO se comparan como texto). */
export function filtrarPorRango<T extends { fecha: string }>(
  registros: T[],
  rango: { desde: string; hasta: string },
): T[] {
  return registros.filter((r) => r.fecha >= rango.desde && r.fecha <= rango.hasta)
}

/**
 * Cambio porcentual contra el periodo anterior. Regresa `undefined` cuando no
 * se puede calcular (sin datos previos), para no mostrar un "+100%" engañoso.
 */
export function calcularTendencia(actual: number, anterior: number): number | undefined {
  if (!Number.isFinite(actual) || !Number.isFinite(anterior)) return undefined
  if (anterior === 0) return undefined
  return ((actual - anterior) / Math.abs(anterior)) * 100
}

export function formatEtiquetaPeriodo(periodo: Periodo, fecha: string): string {
  const date = new Date(`${fecha}T00:00:00`)
  switch (periodo) {
    case 'dia':
      return format(date, 'd MMM', { locale: es })
    case 'semana':
      return format(date, "'sem.' w", { locale: es })
    case 'mes':
    case 'total':
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
      case 'total':
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
