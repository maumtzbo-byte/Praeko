import { supabase } from '@/lib/supabase'
import type { EstadoPedido, PedidoConRelaciones, PrioridadPedido } from '@/types/database'

export interface PedidoInput {
  sucursal_id: string
  producto_id: string
  usuario_id: string
  cantidad: number
  comentario?: string | null
  prioridad: PrioridadPedido
  fecha: string
}

export async function listPedidos(sucursalId?: string): Promise<PedidoConRelaciones[]> {
  let query = supabase
    .from('pedidos')
    .select('*, producto:productos(*, categoria:categorias(*)), sucursal:sucursales(*)')
    .order('created_at', { ascending: false })

  if (sucursalId) query = query.eq('sucursal_id', sucursalId)

  const { data, error } = await query
  if (error) throw error
  return data as PedidoConRelaciones[]
}

export async function createPedido(input: PedidoInput) {
  const { data, error } = await supabase
    .from('pedidos')
    .insert({ ...input, estado: 'pendiente' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateEstadoPedido(id: string, estado: EstadoPedido) {
  const { data, error } = await supabase.from('pedidos').update({ estado }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deletePedido(id: string): Promise<void> {
  const { error } = await supabase.from('pedidos').delete().eq('id', id)
  if (error) throw error
}
