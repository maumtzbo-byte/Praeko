import { supabase } from '@/lib/supabase'
import type { ReporteDiario } from '@/types/database'

export interface ReporteDiarioInput {
  sucursal_id: string
  usuario_id: string
  fecha: string
  ventas_efectivo: number
  ventas_tarjeta: number
  ventas_transferencia: number
  gastos_total: number
  pollos_recibidos: number
  pollos_vendidos: number
  productos_danados: number
  merma_total: number
  observaciones?: string | null
  notas?: string | null
}

export interface ReportesFiltro {
  sucursalId?: string
  desde?: string
  hasta?: string
}

export async function listReportesDiarios(filtro: ReportesFiltro = {}): Promise<ReporteDiario[]> {
  let query = supabase.from('reportes_diarios').select('*').order('fecha', { ascending: false })

  if (filtro.sucursalId) query = query.eq('sucursal_id', filtro.sucursalId)
  if (filtro.desde) query = query.gte('fecha', filtro.desde)
  if (filtro.hasta) query = query.lte('fecha', filtro.hasta)

  const { data, error } = await query
  if (error) throw error
  return data
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
