import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ReporteDiario } from '@/types/database'

function loadImageAsDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export async function exportReportesPDF(
  reportes: ReporteDiario[],
  meta: { titulo: string; sucursalNombre?: (id: string) => string },
) {
  const doc = new jsPDF()
  const logo = await loadImageAsDataUrl('/mascota.png')

  const textX = logo ? 26 : 14
  if (logo) doc.addImage(logo, 'PNG', 14, 9, 14, 14)

  doc.setFontSize(16)
  doc.text('Pimpollo', textX, 18)
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(meta.titulo, 14, 29)

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
    startY: 36,
    head: [['Fecha', 'Sucursal', 'Ventas', 'Gastos', 'Ganancia', 'Pollos vendidos', 'Dañados']],
    body: rows,
    foot: [['', 'Totales', formatCurrency(totalVentas), formatCurrency(totalGastos), formatCurrency(totalGanancia), '', '']],
    headStyles: { fillColor: [244, 180, 0], textColor: 30 },
    footStyles: { fillColor: [244, 244, 244], textColor: 20, fontStyle: 'bold' },
    styles: { fontSize: 9 },
  })

  doc.save(`reportes-${new Date().toISOString().slice(0, 10)}.pdf`)
}
