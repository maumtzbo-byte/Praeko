import * as React from 'react'
import { PackageX, Boxes } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { PeriodSelector } from '@/components/shared/PeriodSelector'
import { SalesTrendChart } from '@/components/charts/SalesTrendChart'
import { TopProductsChart } from '@/components/charts/TopProductsChart'
import { EmptyChartCard } from '@/components/charts/EmptyChartCard'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDashboardData } from '@/hooks/use-dashboard'
import {
  agruparPorPeriodo,
  calcularTendencia,
  formatEtiquetaPeriodo,
  getRangoPeriodo,
  getRangoPeriodoAnterior,
  type Periodo,
} from '@/lib/date-ranges'
import { calcularTotales } from '@/lib/dashboard-totales'
import { formatCurrency, formatNumber } from '@/lib/utils'

export function SucursalDashboard({ sucursalId }: { sucursalId: string | null }) {
  const [periodo, setPeriodo] = React.useState<Periodo>('dia')
  const { desde, hasta } = React.useMemo(() => getRangoPeriodo(periodo), [periodo])
  const anterior = React.useMemo(() => getRangoPeriodoAnterior(desde, hasta), [desde, hasta])

  const { data, isLoading } = useDashboardData({ sucursalId: sucursalId ?? undefined, desde, hasta })
  const { data: dataAnterior } = useDashboardData({
    sucursalId: sucursalId ?? undefined,
    desde: anterior.desde,
    hasta: anterior.hasta,
  })

  const totales = React.useMemo(() => calcularTotales(data?.reportes ?? []), [data])
  const totalesAnteriores = React.useMemo(() => calcularTotales(dataAnterior?.reportes ?? []), [dataAnterior])

  const chartData = React.useMemo(() => {
    if (!data) return []
    const grupos = agruparPorPeriodo(data.reportes, periodo)
    return Object.entries(grupos)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fecha, registros]) => ({
        fecha: formatEtiquetaPeriodo(periodo, fecha),
        ventas: registros.reduce((sum, r) => sum + Number(r.ventas_totales), 0),
        gastos: registros.reduce((sum, r) => sum + Number(r.gastos_total), 0),
        ganancia: registros.reduce((sum, r) => sum + Number(r.ganancia_estimada), 0),
      }))
  }, [data, periodo])

  if (!sucursalId) {
    return (
      <EmptyState
        icon={Boxes}
        title="No tienes una sucursal asignada"
        description="Pide a un administrador que te asigne a una sucursal para ver tu dashboard."
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Mi dashboard"
        description="Resumen de tu sucursal"
        actions={<PeriodSelector value={periodo} onChange={setPeriodo} />}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total vendido"
            value={formatCurrency(totales.totalVentas)}
            trend={calcularTendencia(totales.totalVentas, totalesAnteriores.totalVentas)}
            iconImage="/mascota-dinero-lanzando.png"
          />
          <StatCard
            label="Total gastos"
            value={formatCurrency(totales.totalGastos)}
            trend={calcularTendencia(totales.totalGastos, totalesAnteriores.totalGastos)}
            invertTrendColor
            iconImage="/mascota-ticket.png"
            tone="warning"
          />
          <StatCard
            label="Ganancias"
            value={formatCurrency(totales.ganancia)}
            trend={calcularTendencia(totales.ganancia, totalesAnteriores.ganancia)}
            iconImage="/mascota-dinero.png"
            tone="success"
          />
          <StatCard
            label="Productos vendidos"
            value={formatNumber(totales.pollosVendidos)}
            trend={calcularTendencia(totales.pollosVendidos, totalesAnteriores.pollosVendidos)}
            iconImage="/mascota-carrito.png"
          />
          <StatCard label="Productos dañados" value={formatNumber(totales.productosDanados)} icon={PackageX} tone="destructive" />
          <StatCard
            label="Pedidos pendientes"
            value={formatNumber(data?.pedidosPendientes ?? 0)}
            iconImage="/mascota-caja.png"
            tone="warning"
          />
          <StatCard
            label="Inventario bajo"
            value={formatNumber(data?.inventarioBajo ?? 0)}
            iconImage="/mascota-alerta.png"
            tone="destructive"
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {chartData.length > 0 ? (
          <SalesTrendChart data={chartData} title="Ventas y ganancia" />
        ) : (
          <EmptyChartCard title="Ventas y ganancia" />
        )}
        {(data?.ventasPorProducto ?? []).length > 0 ? (
          <TopProductsChart data={data?.ventasPorProducto ?? []} />
        ) : (
          <EmptyChartCard title="Top productos vendidos" />
        )}
      </div>
    </div>
  )
}
