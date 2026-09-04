import { supabase } from '@/lib/supabase'
import type { InventarioConProducto } from '@/types/database'

export interface InventarioInput {
  sucursal_id: string
  producto_id: string
  cantidad_actual: number
  stock_minimo: number
  costo_unitario: number
}

export async function listInventario(sucursalId?: string): Promise<InventarioConProducto[]> {
  let query = supabase
    .from('inventario')
    .select('*, producto:productos(*)')
    .order('updated_at', { ascending: false })

  if (sucursalId) query = query.eq('sucursal_id', sucursalId)

  const { data, error } = await query
  if (error) throw error
  return data as InventarioConProducto[]
}

export async function upsertInventario(input: InventarioInput) {
  const { data, error } = await supabase
    .from('inventario')
    .upsert(input, { onConflict: 'sucursal_id,producto_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateInventarioCantidad(id: string, cantidad_actual: number) {
  const { data, error } = await supabase
    .from('inventario')
    .update({ cantidad_actual })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteInventario(id: string): Promise<void> {
  const { error } = await supabase.from('inventario').delete().eq('id', id)
  if (error) throw error
}
