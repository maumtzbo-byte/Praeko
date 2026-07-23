import { supabase } from '@/lib/supabase'
import type { Gasto } from '@/types/database'

export interface GastoConCategoria extends Gasto {
  categoria: { id: string; nombre: string } | null
}

export interface GastoInput {
  sucursal_id: string
  usuario_id: string
  categoria_id?: string | null
  monto: number
  concepto: string
  descripcion?: string | null
  fecha: string
  comprobante_url?: string | null
}

export interface GastosFiltro {
  sucursalId?: string
  desde?: string
  hasta?: string
}

export async function listGastos(filtro: GastosFiltro = {}): Promise<GastoConCategoria[]> {
  let query = supabase
    .from('gastos')
    .select('*, categoria:categorias(id, nombre)')
    .order('fecha', { ascending: false })

  if (filtro.sucursalId) query = query.eq('sucursal_id', filtro.sucursalId)
  if (filtro.desde) query = query.gte('fecha', filtro.desde)
  if (filtro.hasta) query = query.lte('fecha', filtro.hasta)

  const { data, error } = await query
  if (error) throw error
  return data as GastoConCategoria[]
}

export async function createGasto(input: GastoInput) {
  const { data, error } = await supabase.from('gastos').insert(input).select().single()
  if (error) throw error
  return data
}

export async function deleteGasto(id: string): Promise<void> {
  const { error } = await supabase.from('gastos').delete().eq('id', id)
  if (error) throw error
}

export async function uploadComprobante(file: File, sucursalId: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${sucursalId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('comprobantes').upload(path, file)
  if (error) throw error
  const { data } = await supabase.storage.from('comprobantes').createSignedUrl(path, 60 * 60 * 24 * 365)
  return data?.signedUrl ?? path
}
