import type { ReporteDiario } from '@/types/database'

export interface TotalesDashboard {
  totalVentas: number
  totalGastos: number
  ganancia: number
  pollosVendidos: number
  productosDanados: number
}

/**
 * Suma los reportes diarios de un periodo. Se usa tanto para el periodo actual
 * como para el anterior, para poder comparar y sacar el % de tendencia.
 */
export function calcularTotales(reportes: ReporteDiario[] = []): TotalesDashboard {
  const totalVentas = reportes.reduce((sum, r) => sum + Number(r.ventas_totales), 0)
  const totalGastos = reportes.reduce((sum, r) => sum + Number(r.gastos_total), 0)
  return {
    totalVentas,
    totalGastos,
    ganancia: totalVentas - totalGastos,
    pollosVendidos: reportes.reduce((sum, r) => sum + Number(r.pollos_vendidos), 0),
    productosDanados: reportes.reduce((sum, r) => sum + Number(r.productos_danados), 0),
  }
}
