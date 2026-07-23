import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReporteDiario } from '@/types/database'

export function exportReportesPDF(
  reportes: ReporteDiario[],
  meta: { titulo: string; sucursalNombre?: (id: string) => string },
) {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text('Pollo Admin System', 14, 18)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(meta.titulo, 14, 25)

  const rows = reportes.map((r) => [
    formatDate(r.fecha),
    meta.sucursalNombre?.(r.sucursal_id) ?? r.sucursal_id.slice(0, 8),
    formatCurrency(r.ventas_totales),
    formatCurrency(r.gastos_total),
    formatCurrency(r.ganancia_estimada),
    String(r.pollos_vendidos),
    String(r.productos_danados),
  ])

  const totalVentas = reportes.reduce((sum, r) => sum + Number(r.ventas_totales), 0)
  const totalGastos = reportes.reduce((sum, r) => sum + Number(r.gastos_total), 0)
  const totalGanancia = totalVentas - totalGastos

  autoTable(doc, {
    startY: 32,
    head: [['Fecha', 'Sucursal', 'Ventas', 'Gastos', 'Ganancia', 'Pollos vendidos', 'Dañados']],
    body: rows,
    foot: [['', 'Totales', formatCurrency(totalVentas), formatCurrency(totalGastos), formatCurrency(totalGanancia), '', '']],
    headStyles: { fillColor: [194, 65, 12] },
    footStyles: { fillColor: [244, 244, 244], textColor: 20, fontStyle: 'bold' },
    styles: { fontSize: 9 },
  })

  doc.save(`reportes-${new Date().toISOString().slice(0, 10)}.pdf`)
}
