import { supabase } from '@/lib/supabase'
import type { MermaConProducto, MotivoMerma } from '@/types/database'

export interface MermaInput {
  sucursal_id: string
  producto_nombre: string
  usuario_id: string
  cantidad: number
  motivo: MotivoMerma
  fecha: string
  observaciones?: string | null
}

export async function listMermas(sucursalId?: string): Promise<MermaConProducto[]> {
  let query = supabase
    .from('mermas')
    .select('*, producto:productos(*)')
    .order('fecha', { ascending: false })

  if (sucursalId) query = query.eq('sucursal_id', sucursalId)

  const { data, error } = await query
  if (error) throw error
  return data as MermaConProducto[]
}

export interface ResumenMermasDia {
  productosDanados: number
  mermaTotal: number
}

/**
 * Resumen de mermas de un día: cuántos incidentes hubo y cuánta cantidad se
 * perdió en total, para no tener que anotarlo por separado en el reporte
 * diario.
 */
export async function getResumenMermasDelDia(sucursalId: string, fecha: string): Promise<ResumenMermasDia> {
  const { data, error } = await supabase.from('mermas').select('cantidad').eq('sucursal_id', sucursalId).eq('fecha', fecha)
  if (error) throw error
  const rows = data ?? []
  return {
    productosDanados: rows.length,
    mermaTotal: rows.reduce((sum, m) => sum + Number(m.cantidad), 0),
  }
}

export async function createMerma(input: MermaInput) {
  const { data, error } = await supabase.from('mermas').insert(input).select().single()
  if (error) throw error
  return data
}

export async function deleteMerma(id: string): Promise<void> {
  const { error } = await supabase.from('mermas').delete().eq('id', id)
  if (error) throw error
}
