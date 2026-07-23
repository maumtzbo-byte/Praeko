import * as React from 'react'
import { MoreHorizontal, Plus, Trash2, Truck } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDeletePedido, usePedidos, useUpdateEstadoPedido } from '@/hooks/use-pedidos'
import { useAuth } from '@/context/AuthContext'
import { PedidoFormDialog } from '@/pages/pedidos/PedidoFormDialog'
import { ESTADO_PEDIDO_BADGE, ESTADO_PEDIDO_LABELS, ESTADO_PEDIDO_ORDEN, PRIORIDAD_BADGE, PRIORIDAD_LABELS } from '@/lib/pedido-labels'
import { formatDate } from '@/lib/utils'
import type { EstadoPedido, PedidoConRelaciones } from '@/types/database'

export function PedidosPage() {
  const { usuario, isAdmin } = useAuth()
  const { data: pedidos = [], isLoading } = usePedidos(isAdmin ? undefined : (usuario?.sucursal_id ?? undefined))
  const updateEstado = useUpdateEstadoPedido()
  const deleteMutation = useDeletePedido()

  const [estadoFiltro, setEstadoFiltro] = React.useState<string>('todos')
  const [formOpen, setFormOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState<PedidoConRelaciones | null>(null)

  const filtered = pedidos.filter((p) => estadoFiltro === 'todos' || p.estado === estadoFiltro)

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Solicitudes de producto entre sucursales y central"
        actions={
          usuario?.sucursal_id && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Nuevo pedido
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={estadoFiltro} onValueChange={setEstadoFiltro}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADO_PEDIDO_ORDEN.map((estado) => (
              <SelectItem key={estado} value={estado}>
                {ESTADO_PEDIDO_LABELS[estado]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Truck} title="No hay pedidos" description="Aún no se han registrado pedidos." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              {isAdmin && <TableHead>Sucursal</TableHead>}
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Prioridad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{formatDate(p.fecha)}</TableCell>
                {isAdmin && <TableCell>{p.sucursal.nombre}</TableCell>}
                <TableCell className="font-medium">
                  {p.producto.nombre}
                  {p.comentario && <p className="text-xs font-normal text-muted-foreground">{p.comentario}</p>}
                </TableCell>
                <TableCell>
                  {p.cantidad} {p.producto.unidad}
                </TableCell>
                <TableCell>
                  <Badge variant={PRIORIDAD_BADGE[p.prioridad]}>{PRIORIDAD_LABELS[p.prioridad]}</Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={p.estado}
                    onValueChange={(estado) => updateEstado.mutate({ id: p.id, estado: estado as EstadoPedido })}
                  >
                    <SelectTrigger className="h-8 w-40">
                      <Badge variant={ESTADO_PEDIDO_BADGE[p.estado]} className="pointer-events-none">
                        {ESTADO_PEDIDO_LABELS[p.estado]}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADO_PEDIDO_ORDEN.map((estado) => (
                        <SelectItem key={estado} value={estado}>
                          {ESTADO_PEDIDO_LABELS[estado]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isAdmin && (
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(p)}>
                          <Trash2 /> Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <PedidoFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar pedido"
        description={`¿Eliminar el pedido de "${deleting?.producto.nombre}"?`}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id)
          setDeleting(null)
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
