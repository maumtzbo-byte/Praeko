import { supabase } from '@/lib/supabase'
import type { HistorialCambio } from '@/types/database'
import type { PaginaResultado } from '@/services/reportes.service'

export interface HistorialFiltro {
  tabla?: string
  sucursalId?: string
}

export async function listHistorial(
  filtro: HistorialFiltro = {},
  pagina: { page: number; pageSize: number } = { page: 1, pageSize: 25 },
): Promise<PaginaResultado<HistorialCambio>> {
  const from = (pagina.page - 1) * pagina.pageSize
  const to = from + pagina.pageSize - 1

  let query = supabase
    .from('historial_cambios')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (filtro.tabla) query = query.eq('tabla', filtro.tabla)
  if (filtro.sucursalId) query = query.eq('sucursal_id', filtro.sucursalId)

  const { data, error, count } = await query
  if (error) throw error
  return { data, count: count ?? 0 }
}
