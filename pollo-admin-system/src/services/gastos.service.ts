import { supabase } from '@/lib/supabase'
import type { Gasto } from '@/types/database'
import type { PaginaResultado } from '@/services/reportes.service'

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

export async function listGastos(
  filtro: GastosFiltro = {},
  pagina: { page: number; pageSize: number } = { page: 1, pageSize: 25 },
): Promise<PaginaResultado<GastoConCategoria>> {
  const from = (pagina.page - 1) * pagina.pageSize
  const to = from + pagina.pageSize - 1

  let query = supabase
    .from('gastos')
    .select('*, categoria:categorias(id, nombre)', { count: 'exact' })
    .order('fecha', { ascending: false })
    .range(from, to)

  if (filtro.sucursalId) query = query.eq('sucursal_id', filtro.sucursalId)
  if (filtro.desde) query = query.gte('fecha', filtro.desde)
  if (filtro.hasta) query = query.lte('fecha', filtro.hasta)

  const { data, error, count } = await query
  if (error) throw error
  return { data: data as GastoConCategoria[], count: count ?? 0 }
}

export async function getGastosTotal(filtro: GastosFiltro = {}): Promise<number> {
  let query = supabase.from('gastos').select('monto')

  if (filtro.sucursalId) query = query.eq('sucursal_id', filtro.sucursalId)
  if (filtro.desde) query = query.gte('fecha', filtro.desde)
  if (filtro.hasta) query = query.lte('fecha', filtro.hasta)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).reduce((sum, g) => sum + Number(g.monto), 0)
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
