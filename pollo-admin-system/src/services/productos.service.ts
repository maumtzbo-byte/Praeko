import { supabase } from '@/lib/supabase'
import type { ProductoConCategoria, UnidadProducto } from '@/types/database'

export interface ProductoInput {
  nombre: string
  categoria_id?: string | null
  unidad: UnidadProducto
  precio_venta: number
  costo: number
  activo: boolean
}

export async function listProductos(): Promise<ProductoConCategoria[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('*, categoria:categorias(*)')
    .order('nombre')
  if (error) throw error
  return data as ProductoConCategoria[]
}

export async function createProducto(input: ProductoInput) {
  const { data, error } = await supabase.from('productos').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateProducto(id: string, input: Partial<ProductoInput>) {
  const { data, error } = await supabase.from('productos').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProducto(id: string): Promise<void> {
  const { error } = await supabase.from('productos').delete().eq('id', id)
  if (error) throw error
}
