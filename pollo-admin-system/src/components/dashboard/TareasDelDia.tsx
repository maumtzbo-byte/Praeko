import { Link } from 'react-router-dom'
import { AlertTriangle, Boxes, CheckCircle2, PartyPopper, Truck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useReporteDelDia } from '@/hooks/use-reportes'
import { cn, todayISO } from '@/lib/utils'

function Pill({
  to,
  tone,
  children,
}: {
  to: string
  tone: 'success' | 'warning'
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80',
        tone === 'success' ? 'bg-success/15 text-success' : 'bg-warning/20 text-warning-foreground',
      )}
    >
      {children}
    </Link>
  )
}

/**
 * Resumen del día pensado para encargados/empleados: en vez de tener que leer
 * varias tarjetas y adivinar qué falta, aquí se ve de un vistazo si ya se
 * capturó el reporte de hoy y qué pendientes hay.
 */
export function TareasDelDia({
  sucursalId,
  pedidosPendientes,
  inventarioBajo,
}: {
  sucursalId: string
  pedidosPendientes: number
  inventarioBajo: number
}) {
  const { data: reporteHoy, isLoading } = useReporteDelDia(sucursalId, todayISO())

  if (isLoading) return <Skeleton className="mb-6 h-20" />

  const reporteListo = Boolean(reporteHoy)
  const todoAlDia = reporteListo && pedidosPendientes === 0 && inventarioBajo === 0

  return (
    <Card className={cn('mb-6', !reporteListo && 'border-warning/40')}>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-sm font-semibold">Tareas de hoy</p>
          {todoAlDia ? (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <PartyPopper className="h-4 w-4 text-success" /> Todo al día, buen trabajo.
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">Esto es lo que falta revisar hoy.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Pill to="/reportes-diarios" tone={reporteListo ? 'success' : 'warning'}>
            {reporteListo ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {reporteListo ? 'Reporte capturado' : 'Reporte pendiente'}
          </Pill>
          {pedidosPendientes > 0 && (
            <Pill to="/pedidos" tone="warning">
              <Truck className="h-4 w-4" />
              {pedidosPendientes} {pedidosPendientes === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
            </Pill>
          )}
          {inventarioBajo > 0 && (
            <Pill to="/inventario" tone="warning">
              <Boxes className="h-4 w-4" />
              {inventarioBajo} {inventarioBajo === 1 ? 'producto con stock bajo' : 'productos con stock bajo'}
            </Pill>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
