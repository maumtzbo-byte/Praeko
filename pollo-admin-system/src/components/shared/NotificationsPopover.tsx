import { useNavigate } from 'react-router-dom'
import { Bell, PackageX, AlertTriangle, Truck, RefreshCw, FileWarning, Info } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { useMarcarLeida, useMarcarTodasLeidas, useNotificaciones } from '@/hooks/use-notificaciones'
import { cn, formatDateTime } from '@/lib/utils'
import type { TipoNotificacion } from '@/types/database'

const ICONS: Record<TipoNotificacion, typeof Bell> = {
  reporte_faltante: FileWarning,
  inventario_bajo: PackageX,
  merma_alta: AlertTriangle,
  pedido_pendiente: Truck,
  pedido_actualizado: RefreshCw,
  general: Info,
}

export function NotificationsPopover() {
  const { data: notificaciones = [] } = useNotificaciones()
  const marcarLeida = useMarcarLeida()
  const marcarTodas = useMarcarTodasLeidas()
  const navigate = useNavigate()

  const noLeidas = notificaciones.filter((n) => !n.leida)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {noLeidas.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {noLeidas.length > 9 ? '9+' : noLeidas.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificaciones</p>
          {noLeidas.length > 0 && (
            <button
              type="button"
              className="rounded text-xs font-medium text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
              onClick={() => marcarTodas.mutate(noLeidas.map((n) => n.id))}
            >
              Marcar todas leídas
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {notificaciones.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sin notificaciones</p>
          ) : (
            notificaciones.map((n) => {
              const Icon = ICONS[n.tipo]
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.leida) marcarLeida.mutate(n.id)
                    if (n.link) navigate(n.link)
                  }}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left outline-none transition-colors last:border-0 hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset',
                    !n.leida && 'bg-primary/5',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                      n.leida ? 'bg-muted text-muted-foreground' : 'bg-primary/15 text-primary',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{n.titulo}</p>
                      {!n.leida && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.mensaje}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(n.created_at)}</p>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
