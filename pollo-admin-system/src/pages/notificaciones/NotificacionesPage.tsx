import * as React from 'react'
import { Bell, FileWarning, PackageX, AlertTriangle, Truck, RefreshCw, Info, CheckCheck } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMarcarLeida, useMarcarTodasLeidas, useNotificaciones } from '@/hooks/use-notificaciones'
import { cn, formatDateTime } from '@/lib/utils'
import type { TipoNotificacion } from '@/types/database'

const TIPO_LABELS: Record<TipoNotificacion, string> = {
  reporte_faltante: 'Reporte faltante',
  inventario_bajo: 'Inventario bajo',
  merma_alta: 'Merma alta',
  pedido_pendiente: 'Pedido pendiente',
  pedido_actualizado: 'Pedido actualizado',
  general: 'General',
}

const ICONS: Record<TipoNotificacion, typeof Bell> = {
  reporte_faltante: FileWarning,
  inventario_bajo: PackageX,
  merma_alta: AlertTriangle,
  pedido_pendiente: Truck,
  pedido_actualizado: RefreshCw,
  general: Info,
}

export function NotificacionesPage() {
  const { data: notificaciones = [], isLoading } = useNotificaciones()
  const marcarLeida = useMarcarLeida()
  const marcarTodas = useMarcarTodasLeidas()

  const [tipoFiltro, setTipoFiltro] = React.useState('todos')
  const filtered = notificaciones.filter((n) => tipoFiltro === 'todos' || n.tipo === tipoFiltro)
  const noLeidas = notificaciones.filter((n) => !n.leida)

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        description="Alertas de reportes, inventario, mermas y pedidos"
        actions={
          noLeidas.length > 0 && (
            <Button variant="outline" onClick={() => marcarTodas.mutate(noLeidas.map((n) => n.id))}>
              <CheckCheck /> Marcar todas leídas
            </Button>
          )
        }
      />

      <div className="mb-4">
        <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {Object.entries(TIPO_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton columns={1} rows={4} header={false} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="Sin notificaciones" description="No hay alertas para mostrar con este filtro." />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((n) => {
            const Icon = ICONS[n.tipo]
            return (
              <div
                key={n.id}
                className={cn(
                  'flex items-start gap-3 rounded-xl border border-border p-4 transition-colors',
                  !n.leida && 'bg-primary/5',
                )}
              >
                <div
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    n.leida ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{n.titulo}</p>
                    <Badge variant="outline">{TIPO_LABELS[n.tipo]}</Badge>
                    {!n.leida && <Badge>Nueva</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.mensaje}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{formatDateTime(n.created_at)}</p>
                </div>
                {!n.leida && (
                  <Button variant="ghost" size="sm" onClick={() => marcarLeida.mutate(n.id)}>
                    Marcar leída
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
