import * as React from 'react'
import { PackageX, Trophy } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { PeriodSelector } from '@/components/shared/PeriodSelector'
import { SalesTrendChart } from '@/components/charts/SalesTrendChart'
import { BranchComparisonChart } from '@/components/charts/BranchComparisonChart'
import { TopProductsChart } from '@/components/charts/TopProductsChart'
import { EmptyChartCard } from '@/components/charts/EmptyChartCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useDashboardData, useComparativoSucursales } from '@/hooks/use-dashboard'
import { useSucursales } from '@/hooks/use-sucursales'
import {
  agruparPorPeriodo,
  calcularTendencia,
  filtrarPorRango,
  formatEtiquetaPeriodo,
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

export function AdminDashboard() {
  const [periodo, setPeriodo] = React.useState<Periodo>('dia')
  const [sucursalId, setSucursalId] = React.useState<string>('todas')
  // Ventana amplia para la gráfica (ej. últimos 12 meses si el periodo es "mes").
  const { desde, hasta } = React.useMemo(() => getRangoPeriodo(periodo), [periodo])
  // Periodo en curso y el mismo tramo del anterior, para las tarjetas y el %.
  const rangoActual = React.useMemo(() => getRangoActual(periodo), [periodo])
  const rangoAnterior = React.useMemo(() => getRangoAnterior(periodo), [periodo])

  const { data: sucursales = [] } = useSucursales()
  const { data, isLoading } = useDashboardData({
    sucursalId: sucursalId === 'todas' ? undefined : sucursalId,
    desde,
    hasta,
  })
  const { data: comparativo = [] } = useComparativoSucursales(rangoActual.desde, rangoActual.hasta)

  // La ventana de la gráfica siempre contiene al periodo actual y al anterior,
  // así que se filtran de los datos ya cargados en vez de pedirlos otra vez.
  const totales = React.useMemo(
    () => calcularTotales(filtrarPorRango(data?.reportes ?? [], rangoActual)),
    [data, rangoActual],
  )
  const totalesAnteriores = React.useMemo(
    () => calcularTotales(filtrarPorRango(data?.reportes ?? [], rangoAnterior)),
    [data, rangoAnterior],
  )
  const trendLabel = PERIODO_ANTERIOR_LABELS[periodo]
  const trendEmptyLabel = PERIODO_SIN_COMPARACION_LABELS[periodo]

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

  const topSucursales = React.useMemo(
    () => [...comparativo].sort((a, b) => b.ventas - a.ventas).slice(0, 5),
    [comparativo],
  )

  return (
    <div>
      <PageHeader
        title="Dashboard general"
        description="Vista consolidada de todas las sucursales"
        actions={
          <>
            <Select value={sucursalId} onValueChange={setSucursalId}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sucursales</SelectItem>
                {sucursales.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <PeriodSelector value={periodo} onChange={setPeriodo} />
          </>
        }
      />

      <p className="mb-3 text-xs font-medium text-muted-foreground">
        Mostrando: {PERIODO_ACTUAL_LABELS[periodo]}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Total vendido"
            value={formatCurrency(totales.totalVentas)}
            trend={calcularTendencia(totales.totalVentas, totalesAnteriores.totalVentas)}
            trendLabel={trendLabel}
            trendEmptyLabel={trendEmptyLabel}
            iconImage="/mascota-dinero-lanzando.png"
            tone="default"
          />
          <StatCard
            label="Total gastos"
            value={formatCurrency(totales.totalGastos)}
            trend={calcularTendencia(totales.totalGastos, totalesAnteriores.totalGastos)}
            trendLabel={trendLabel}
            trendEmptyLabel={trendEmptyLabel}
            invertTrendColor
            iconImage="/mascota-ticket.png"
            tone="warning"
          />
          <StatCard
            label="Ganancias"
            value={formatCurrency(totales.ganancia)}
            trend={calcularTendencia(totales.ganancia, totalesAnteriores.ganancia)}
            trendLabel={trendLabel}
            trendEmptyLabel={trendEmptyLabel}
            iconImage="/mascota-dinero.png"
            tone="success"
          />
          <StatCard
            label="Productos vendidos"
            value={formatNumber(totales.pollosVendidos)}
            trend={calcularTendencia(totales.pollosVendidos, totalesAnteriores.pollosVendidos)}
            trendLabel={trendLabel}
            trendEmptyLabel={trendEmptyLabel}
            iconImage="/mascota-carrito.png"
          />
          <StatCard
            label="Productos dañados"
            value={formatNumber(totales.productosDanados)}
            icon={PackageX}
            tone="destructive"
          />
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
          <StatCard label="Sucursales activas" value={formatNumber(sucursales.filter((s) => s.estado === 'activa').length)} iconImage="/mascota-mapa.png" />
        </div>
      )}

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {chartData.length > 0 ? (
            <SalesTrendChart data={chartData} title={`Ventas y ganancia por ${periodoLabel(periodo)}`} />
          ) : (
            <EmptyChartCard title={`Ventas y ganancia por ${periodoLabel(periodo)}`} />
          )}
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" /> Top sucursales
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topSucursales.length === 0 && <p className="text-sm text-muted-foreground">Sin datos en este periodo.</p>}
            {topSucursales.map((s, index) => (
              <div key={s.sucursal_id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? 'default' : 'secondary'} className="h-6 w-6 justify-center rounded-full p-0">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">{s.nombre}</p>
                    <p className="text-xs text-muted-foreground">Ganancia: {formatCurrency(s.ganancia)}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(s.ventas)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {comparativo.length > 0 ? (
          <BranchComparisonChart data={comparativo} />
        ) : (
          <EmptyChartCard title="Comparación entre sucursales" height="h-80" />
        )}
        {(data?.ventasPorProducto ?? []).length > 0 ? (
          <TopProductsChart data={data?.ventasPorProducto ?? []} />
        ) : (
          <EmptyChartCard title="Top productos vendidos" height="h-80" />
        )}
      </div>
    </div>
  )
}

function periodoLabel(periodo: Periodo): string {
  switch (periodo) {
    case 'dia':
      return 'día'
    case 'semana':
      return 'semana'
    case 'mes':
      return 'mes'
    case 'anio':
      return 'año'
  }
}
