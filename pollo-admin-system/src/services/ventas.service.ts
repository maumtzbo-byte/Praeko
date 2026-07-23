import { supabase } from '@/lib/supabase'
import type { MetodoPago } from '@/types/database'

export interface VentaInput {
  sucursal_id: string
  reporte_id?: string | null
  producto_id: string
  usuario_id: string
  cantidad: number
  precio_unitario: number
  metodo_pago: MetodoPago
  fecha: string
}

export async function listVentasPorReporte(reporteId: string) {
  const { data, error } = await supabase
    .from('ventas')
    .select('*, producto:productos(nombre, unidad)')
    .eq('reporte_id', reporteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createVenta(input: VentaInput) {
  const { data, error } = await supabase.from('ventas').insert(input).select().single()
  if (error) throw error
  return data
}

export async function deleteVenta(id: string): Promise<void> {
  const { error } = await supabase.from('ventas').delete().eq('id', id)
  if (error) throw error
}
