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

/**
 * Suma las unidades vendidas ese día de productos de la categoría "Pollo",
 * para no tener que escribirlo por separado en el reporte diario.
 */
export async function getPollosVendidosDelDia(sucursalId: string, fecha: string): Promise<number> {
  const { data: categoria, error: errCategoria } = await supabase
    .from('categorias')
    .select('id')
    .eq('nombre', 'Pollo')
    .maybeSingle()
  if (errCategoria) throw errCategoria
  if (!categoria) return 0

  const { data: productosPollo, error: errProductos } = await supabase
    .from('productos')
    .select('id')
    .eq('categoria_id', categoria.id)
  if (errProductos) throw errProductos
  const productoIds = (productosPollo ?? []).map((p) => p.id)
  if (productoIds.length === 0) return 0

  const { data: ventas, error: errVentas } = await supabase
    .from('ventas')
    .select('cantidad')
    .eq('sucursal_id', sucursalId)
    .eq('fecha', fecha)
    .in('producto_id', productoIds)
  if (errVentas) throw errVentas

  return (ventas ?? []).reduce((sum, v) => sum + Number(v.cantidad), 0)
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
