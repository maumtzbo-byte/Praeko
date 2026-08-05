import { supabase } from '@/lib/supabase'
import type { ReporteDiario } from '@/types/database'

export interface ReporteDiarioInput {
  sucursal_id: string
  usuario_id: string
  fecha: string
  vta_sucursal: number
  tarjeta: number
  deposito: number
  didi: number
  rappi: number
  uber: number
  gastos_total: number
  pollos_recibidos: number
  pollos_vendidos: number
  productos_danados: number
  merma_total: number
  pollo_completo: number
  medio_pollo: number
  venta_complementos: number
  venta_extras: number
  promo_miercoles: number
  promo_2x: number
  promo_1_5: number
  observaciones?: string | null
  notas?: string | null
  recolecto?: string | null
}

export interface ReportesFiltro {
  sucursalId?: string
  usuarioId?: string
  desde?: string
  hasta?: string
}

export interface PaginaResultado<T> {
  data: T[]
  count: number
}

export async function listReportesDiarios(
  filtro: ReportesFiltro = {},
  pagina: { page: number; pageSize: number } = { page: 1, pageSize: 25 },
): Promise<PaginaResultado<ReporteDiario>> {
  const from = (pagina.page - 1) * pagina.pageSize
  const to = from + pagina.pageSize - 1

  let query = supabase
    .from('reportes_diarios')
    .select('*', { count: 'exact' })
    .order('fecha', { ascending: false })
    .range(from, to)

  if (filtro.sucursalId) query = query.eq('sucursal_id', filtro.sucursalId)
  if (filtro.usuarioId) query = query.eq('usuario_id', filtro.usuarioId)
  if (filtro.desde) query = query.gte('fecha', filtro.desde)
  if (filtro.hasta) query = query.lte('fecha', filtro.hasta)

  const { data, error, count } = await query
  if (error) throw error
  return { data, count: count ?? 0 }
}

export async function listReportesDiariosParaExportar(filtro: ReportesFiltro = {}): Promise<ReporteDiario[]> {
  let query = supabase.from('reportes_diarios').select('*').order('fecha', { ascending: false })

  if (filtro.sucursalId) query = query.eq('sucursal_id', filtro.sucursalId)
  if (filtro.usuarioId) query = query.eq('usuario_id', filtro.usuarioId)
  if (filtro.desde) query = query.gte('fecha', filtro.desde)
  if (filtro.hasta) query = query.lte('fecha', filtro.hasta)

  const { data, error } = await query
  if (error) throw error
  return data
}

export interface ReportesTotales {
  ventas: number
  gastos: number
  ganancia: number
}

export async function getReportesTotales(filtro: ReportesFiltro = {}): Promise<ReportesTotales> {
  let query = supabase.from('reportes_diarios').select('ventas_totales, gastos_total, ganancia_estimada')

  if (filtro.sucursalId) query = query.eq('sucursal_id', filtro.sucursalId)
  if (filtro.usuarioId) query = query.eq('usuario_id', filtro.usuarioId)
  if (filtro.desde) query = query.gte('fecha', filtro.desde)
  if (filtro.hasta) query = query.lte('fecha', filtro.hasta)

  const { data, error } = await query
  if (error) throw error

  return (data ?? []).reduce<ReportesTotales>(
    (acc, r) => ({
      ventas: acc.ventas + Number(r.ventas_totales),
      gastos: acc.gastos + Number(r.gastos_total),
      ganancia: acc.ganancia + Number(r.ganancia_estimada),
    }),
    { ventas: 0, gastos: 0, ganancia: 0 },
  )
}

export async function getReporteDelDia(sucursalId: string, fecha: string): Promise<ReporteDiario | null> {
  const { data, error } = await supabase
    .from('reportes_diarios')
    .select('*')
    .eq('sucursal_id', sucursalId)
    .eq('fecha', fecha)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertReporteDiario(input: ReporteDiarioInput): Promise<ReporteDiario> {
  const { data, error } = await supabase
    .from('reportes_diarios')
    .upsert(input, { onConflict: 'sucursal_id,fecha' })
    .select()
    .single()
  if (error) throw error
  return data
}
