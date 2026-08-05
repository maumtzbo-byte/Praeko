import * as React from 'react'
import { PackageX, Boxes } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { TareasDelDia } from '@/components/dashboard/TareasDelDia'
import { PeriodSelector } from '@/components/shared/PeriodSelector'
import { PeriodNavigator } from '@/components/shared/PeriodNavigator'
import { SalesTrendChart } from '@/components/charts/SalesTrendChart'
import { TopProductsChart } from '@/components/charts/TopProductsChart'
import { EmptyChartCard } from '@/components/charts/EmptyChartCard'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useDashboardData } from '@/hooks/use-dashboard'
import {
  agruparPorPeriodo,
  calcularTendencia,
  esPeriodoVigente,
  filtrarPorRango,
  formatEtiquetaPeriodo,
  formatRangoNavegacion,
  getRangoActual,
  getRangoAnterior,
  getRangoPeriodo,
  PERIODO_ACTUAL_LABELS,
  PERIODO_ANTERIOR_LABELS,
  PERIODO_SIN_COMPARACION_LABELS,
  type Periodo,
} from '@/lib/date-ranges'
import { calcularTotales } from '@/lib/dashboard-totales'
import { formatCurrency, formatNumber } from '@/lib/utils'

export function SucursalDashboard({ sucursalId }: { sucursalId: string | null }) {
  const [periodo, setPeriodo] = React.useState<Periodo>('dia')
  const [referencia, setReferencia] = React.useState(new Date())
  React.useEffect(() => setReferencia(new Date()), [periodo])

  // Ventana amplia para la gráfica; periodo en curso y anterior para las tarjetas.
  const { desde, hasta } = React.useMemo(() => getRangoPeriodo(periodo, referencia), [periodo, referencia])
  const rangoActual = React.useMemo(() => getRangoActual(periodo, referencia), [periodo, referencia])
  const rangoAnterior = React.useMemo(() => getRangoAnterior(periodo, referencia), [periodo, referencia])

  const { data, isLoading } = useDashboardData({ sucursalId: sucursalId ?? undefined, desde, hasta })

  const totales = React.useMemo(
    () => calcularTotales(filtrarPorRango(data?.reportes ?? [], rangoActual)),
    [data, rangoActual],
  )
  const totalesAnteriores = React.useMemo(
    () => calcularTotales(filtrarPorRango(data?.reportes ?? [], rangoAnterior)),
    [data, rangoAnterior],
  )
  const mostrarTendencia = periodo !== 'total'
  const trendLabel = mostrarTendencia ? PERIODO_ANTERIOR_LABELS[periodo] : undefined
  const trendEmptyLabel = mostrarTendencia ? PERIODO_SIN_COMPARACION_LABELS[periodo] : undefined
  const calcTrend = (actual: number, anterior: number) => (mostrarTendencia ? calcularTendencia(actual, anterior) : undefined)

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

  const mostrandoLabel = esPeriodoVigente(periodo, referencia)
    ? PERIODO_ACTUAL_LABELS[periodo]
    : formatRangoNavegacion(periodo, referencia)

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
        actions={
          <>
            <PeriodSelector value={periodo} onChange={setPeriodo} />
            <PeriodNavigator periodo={periodo} referencia={referencia} onChange={setReferencia} />
          </>
        }
      />

      <TareasDelDia
        sucursalId={sucursalId}
        pedidosPendientes={data?.pedidosPendientes ?? 0}
        inventarioBajo={data?.inventarioBajo ?? 0}
      />

      <p className="mb-3 text-xs font-medium text-muted-foreground">Mostrando: {mostrandoLabel}</p>

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
            trend={calcTrend(totales.totalVentas, totalesAnteriores.totalVentas)}
            trendLabel={trendLabel}
            trendEmptyLabel={trendEmptyLabel}
            iconImage="/mascota-dinero-lanzando.png"
          />
          <StatCard
            label="Total gastos"
            value={formatCurrency(totales.totalGastos)}
            trend={calcTrend(totales.totalGastos, totalesAnteriores.totalGastos)}
            trendLabel={trendLabel}
            trendEmptyLabel={trendEmptyLabel}
            invertTrendColor
            iconImage="/mascota-ticket.png"
            tone="warning"
          />
          <StatCard
            label="Ganancias"
            value={formatCurrency(totales.ganancia)}
            trend={calcTrend(totales.ganancia, totalesAnteriores.ganancia)}
            trendLabel={trendLabel}
            trendEmptyLabel={trendEmptyLabel}
            iconImage="/mascota-dinero.png"
            tone="success"
          />
          <StatCard
            label="Productos vendidos"
            value={formatNumber(totales.pollosVendidos)}
            trend={calcTrend(totales.pollosVendidos, totalesAnteriores.pollosVendidos)}
            trendLabel={trendLabel}
            trendEmptyLabel={trendEmptyLabel}
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
