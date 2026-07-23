import * as React from 'react'
import { Wallet, Receipt, TrendingUp, ShoppingBasket, PackageX, Truck, Boxes } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { QuickStartCard } from '@/components/shared/QuickStartCard'
import { StatCard } from '@/components/shared/StatCard'
import { PeriodSelector } from '@/components/shared/PeriodSelector'
import { SalesTrendChart } from '@/components/charts/SalesTrendChart'
import { TopProductsChart } from '@/components/charts/TopProductsChart'
import { EmptyChartCard } from '@/components/charts/EmptyChartCard'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDashboardData } from '@/hooks/use-dashboard'
import { agruparPorPeriodo, formatEtiquetaPeriodo, getRangoPeriodo, type Periodo } from '@/lib/date-ranges'
import { formatCurrency, formatNumber } from '@/lib/utils'

export function SucursalDashboard({ sucursalId }: { sucursalId: string | null }) {
  const [periodo, setPeriodo] = React.useState<Periodo>('dia')
  const { desde, hasta } = React.useMemo(() => getRangoPeriodo(periodo), [periodo])

  const { data, isLoading } = useDashboardData({ sucursalId: sucursalId ?? undefined, desde, hasta })

  const totales = React.useMemo(() => {
    const reportes = data?.reportes ?? []
    const totalVentas = reportes.reduce((sum, r) => sum + Number(r.ventas_totales), 0)
    const totalGastos = reportes.reduce((sum, r) => sum + Number(r.gastos_total), 0)
    return {
      totalVentas,
      totalGastos,
      ganancia: totalVentas - totalGastos,
      pollosVendidos: reportes.reduce((sum, r) => sum + Number(r.pollos_vendidos), 0),
      productosDanados: reportes.reduce((sum, r) => sum + Number(r.productos_danados), 0),
    }
  }, [data])

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

      <QuickStartCard />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total vendido" value={formatCurrency(totales.totalVentas)} icon={Wallet} />
          <StatCard label="Total gastos" value={formatCurrency(totales.totalGastos)} icon={Receipt} tone="warning" />
          <StatCard label="Ganancias" value={formatCurrency(totales.ganancia)} icon={TrendingUp} tone="success" />
          <StatCard label="Productos vendidos" value={formatNumber(totales.pollosVendidos)} icon={ShoppingBasket} />
          <StatCard label="Productos dañados" value={formatNumber(totales.productosDanados)} icon={PackageX} tone="destructive" />
          <StatCard label="Pedidos pendientes" value={formatNumber(data?.pedidosPendientes ?? 0)} icon={Truck} tone="warning" />
          <StatCard label="Inventario bajo" value={formatNumber(data?.inventarioBajo ?? 0)} icon={Boxes} tone="destructive" />
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
