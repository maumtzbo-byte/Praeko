import { supabase } from '@/lib/supabase'
import type { ReporteDiario } from '@/types/database'

export interface DashboardFiltro {
  sucursalId?: string
  desde: string
  hasta: string
}

export interface VentaProductoAgregada {
  producto_id: string
  nombre: string
  cantidad: number
  total: number
}

export interface DashboardData {
  reportes: ReporteDiario[]
  ventasPorProducto: VentaProductoAgregada[]
  pedidosPendientes: number
  inventarioBajo: number
  sucursales: { id: string; nombre: string }[]
}

export async function fetchDashboardData(filtro: DashboardFiltro): Promise<DashboardData> {
  let reportesQuery = supabase
    .from('reportes_diarios')
    .select('*')
    .gte('fecha', filtro.desde)
    .lte('fecha', filtro.hasta)
    .order('fecha', { ascending: true })

  if (filtro.sucursalId) reportesQuery = reportesQuery.eq('sucursal_id', filtro.sucursalId)

  let ventasQuery = supabase
    .from('ventas')
    .select('producto_id, cantidad, subtotal, producto:productos(nombre)')
    .gte('fecha', filtro.desde)
    .lte('fecha', filtro.hasta)

  if (filtro.sucursalId) ventasQuery = ventasQuery.eq('sucursal_id', filtro.sucursalId)

  let pedidosQuery = supabase
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('estado', 'pendiente')

  if (filtro.sucursalId) pedidosQuery = pedidosQuery.eq('sucursal_id', filtro.sucursalId)

  let inventarioQuery = supabase
    .from('inventario')
    .select('id, cantidad_actual, stock_minimo')

  if (filtro.sucursalId) inventarioQuery = inventarioQuery.eq('sucursal_id', filtro.sucursalId)

  const [reportesRes, ventasRes, pedidosRes, inventarioRes, sucursalesRes] = await Promise.all([
    reportesQuery,
    ventasQuery,
    pedidosQuery,
    inventarioQuery,
    supabase.from('sucursales').select('id, nombre').order('nombre'),
  ])

  if (reportesRes.error) throw reportesRes.error
  if (ventasRes.error) throw ventasRes.error
  if (pedidosRes.error) throw pedidosRes.error
  if (inventarioRes.error) throw inventarioRes.error
  if (sucursalesRes.error) throw sucursalesRes.error

  const agregados = new Map<string, VentaProductoAgregada>()
  for (const venta of ventasRes.data ?? []) {
    const producto = venta.producto as unknown as { nombre: string } | null
    const nombre = producto?.nombre ?? 'Producto'
    const existing = agregados.get(venta.producto_id)
    if (existing) {
      existing.cantidad += Number(venta.cantidad)
      existing.total += Number(venta.subtotal)
    } else {
      agregados.set(venta.producto_id, {
        producto_id: venta.producto_id,
        nombre,
        cantidad: Number(venta.cantidad),
        total: Number(venta.subtotal),
      })
    }
  }

  const inventarioBajo = (inventarioRes.data ?? []).filter(
    (item) => Number(item.cantidad_actual) <= Number(item.stock_minimo),
  ).length

  return {
    reportes: reportesRes.data as ReporteDiario[],
    ventasPorProducto: Array.from(agregados.values()).sort((a, b) => b.total - a.total),
    pedidosPendientes: pedidosRes.count ?? 0,
    inventarioBajo,
    sucursales: sucursalesRes.data,
  }
}

export interface ComparativoSucursal {
  sucursal_id: string
  nombre: string
  ventas: number
  gastos: number
  ganancia: number
}

export async function fetchComparativoSucursales(desde: string, hasta: string): Promise<ComparativoSucursal[]> {
  const { data: sucursales, error: errSuc } = await supabase.from('sucursales').select('id, nombre')
  if (errSuc) throw errSuc

  const { data: reportes, error: errRep } = await supabase
    .from('reportes_diarios')
    .select('sucursal_id, ventas_totales, gastos_total, ganancia_estimada')
    .gte('fecha', desde)
    .lte('fecha', hasta)
  if (errRep) throw errRep

  return sucursales.map((s) => {
    const propios = (reportes ?? []).filter((r) => r.sucursal_id === s.id)
    return {
      sucursal_id: s.id,
      nombre: s.nombre,
      ventas: propios.reduce((sum, r) => sum + Number(r.ventas_totales), 0),
      gastos: propios.reduce((sum, r) => sum + Number(r.gastos_total), 0),
      ganancia: propios.reduce((sum, r) => sum + Number(r.ganancia_estimada), 0),
    }
  })
}
