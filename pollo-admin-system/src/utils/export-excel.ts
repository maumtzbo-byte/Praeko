import * as XLSX from 'xlsx'
import { formatDate } from '@/lib/utils'
import type { ReporteDiario } from '@/types/database'

export function exportReportesExcel(reportes: ReporteDiario[], sucursalNombre?: (id: string) => string) {
  const rows = reportes.map((r) => ({
    Fecha: formatDate(r.fecha),
    Sucursal: sucursalNombre?.(r.sucursal_id) ?? r.sucursal_id,
    'Ventas efectivo': r.ventas_efectivo,
    'Ventas tarjeta': r.ventas_tarjeta,
    'Ventas transferencia': r.ventas_transferencia,
    'Ventas totales': r.ventas_totales,
    Gastos: r.gastos_total,
    'Ganancia estimada': r.ganancia_estimada,
    'Pollos recibidos': r.pollos_recibidos,
    'Pollos vendidos': r.pollos_vendidos,
    'Productos dañados': r.productos_danados,
    Merma: r.merma_total,
    Observaciones: r.observaciones ?? '',
    Notas: r.notas ?? '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = Object.keys(rows[0] ?? {}).map(() => ({ wch: 18 }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reportes')
  XLSX.writeFile(workbook, `reportes-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
