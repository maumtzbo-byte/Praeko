import { supabase } from '@/lib/supabase'
import type { MermaConProducto, MotivoMerma } from '@/types/database'

export interface MermaInput {
  sucursal_id: string
  producto_id: string
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

export async function createMerma(input: MermaInput) {
  const { data, error } = await supabase.from('mermas').insert(input).select().single()
  if (error) throw error
  return data
}

export async function deleteMerma(id: string): Promise<void> {
  const { error } = await supabase.from('mermas').delete().eq('id', id)
  if (error) throw error
}
