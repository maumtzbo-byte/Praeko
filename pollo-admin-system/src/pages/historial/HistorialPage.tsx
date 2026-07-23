import * as React from 'react'
import { History } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useHistorial } from '@/hooks/use-historial'
import { useSucursales } from '@/hooks/use-sucursales'
import { useAuth } from '@/context/AuthContext'
import { formatDateTime } from '@/lib/utils'
import type { BadgeProps } from '@/components/ui/badge'

const TABLA_LABELS: Record<string, string> = {
  pedidos: 'Pedidos',
  reportes_diarios: 'Reportes diarios',
  inventario: 'Inventario',
}

const ACCION_BADGE: Record<string, NonNullable<BadgeProps['variant']>> = {
  crear: 'success',
  actualizar: 'default',
  eliminar: 'destructive',
}

const ACCION_LABEL: Record<string, string> = {
  crear: 'Creado',
  actualizar: 'Actualizado',
  eliminar: 'Eliminado',
}

export function HistorialPage() {
  const { usuario, isAdmin } = useAuth()
  const { data: sucursales = [] } = useSucursales()

  const [tabla, setTabla] = React.useState('todas')
  const [sucursalId, setSucursalId] = React.useState(isAdmin ? 'todas' : (usuario?.sucursal_id ?? 'todas'))

  const { data: historial = [], isLoading } = useHistorial({
    tabla: tabla === 'todas' ? undefined : tabla,
    sucursalId: sucursalId === 'todas' ? undefined : sucursalId,
  })

  return (
    <div>
      <PageHeader title="Historial de cambios" description="Auditoría de pedidos, reportes diarios e inventario" />

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={tabla} onValueChange={setTabla}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las tablas</SelectItem>
            {Object.entries(TABLA_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isAdmin && (
          <Select value={sucursalId} onValueChange={setSucursalId}>
            <SelectTrigger className="w-48">
              <SelectValue />
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
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : historial.length === 0 ? (
        <EmptyState icon={History} title="Sin movimientos" description="Aún no hay cambios registrados con estos filtros." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tabla</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historial.map((h) => (
              <TableRow key={h.id}>
                <TableCell>{formatDateTime(h.created_at)}</TableCell>
                <TableCell>{TABLA_LABELS[h.tabla] ?? h.tabla}</TableCell>
                <TableCell>
                  <Badge variant={ACCION_BADGE[h.accion]}>{ACCION_LABEL[h.accion]}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{h.registro_id.slice(0, 8)}…</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
