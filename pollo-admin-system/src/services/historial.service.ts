import { supabase } from '@/lib/supabase'
import type { HistorialCambio } from '@/types/database'

export interface HistorialFiltro {
  tabla?: string
  sucursalId?: string
}

export async function listHistorial(filtro: HistorialFiltro = {}): Promise<HistorialCambio[]> {
  let query = supabase
    .from('historial_cambios')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (filtro.tabla) query = query.eq('tabla', filtro.tabla)
  if (filtro.sucursalId) query = query.eq('sucursal_id', filtro.sucursalId)

  const { data, error } = await query
  if (error) throw error
  return data
}
