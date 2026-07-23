import * as React from 'react'
import { AlertTriangle, Boxes, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDeleteInventario, useInventario } from '@/hooks/use-inventario'
import { useSucursales } from '@/hooks/use-sucursales'
import { useDebounce } from '@/hooks/use-debounce'
import { useAuth } from '@/context/AuthContext'
import { InventarioFormDialog } from '@/pages/inventario/InventarioFormDialog'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { InventarioConProducto } from '@/types/database'

export function InventarioPage() {
  const { usuario, isAdmin } = useAuth()
  const { data: sucursales = [] } = useSucursales()

  const [sucursalId, setSucursalId] = React.useState<string>(usuario?.sucursal_id ?? '')
  React.useEffect(() => {
    if (!isAdmin && usuario?.sucursal_id) setSucursalId(usuario.sucursal_id)
  }, [isAdmin, usuario])

  const { data: inventario = [], isLoading } = useInventario(sucursalId || undefined)
  const deleteMutation = useDeleteInventario()

  const [search, setSearch] = React.useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [soloAlertas, setSoloAlertas] = React.useState(false)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<InventarioConProducto | null>(null)
  const [deleting, setDeleting] = React.useState<InventarioConProducto | null>(null)

  const filtered = inventario.filter((item) => {
    const matchesSearch = item.producto.nombre.toLowerCase().includes(debouncedSearch.toLowerCase())
    const bajo = item.cantidad_actual <= item.stock_minimo
    return matchesSearch && (!soloAlertas || bajo)
  })

  const alertas = inventario.filter((item) => item.cantidad_actual <= item.stock_minimo).length
  const canManage = isAdmin || Boolean(sucursalId)

  return (
    <div>
      <PageHeader
        title="Inventario"
        description="Existencias y alertas de stock mínimo por sucursal"
        actions={
          canManage && (
            <Button
              onClick={() => {
                setEditing(null)
                setFormOpen(true)
              }}
            >
              <Plus /> Agregar producto
            </Button>
          )
        }
      />

      {alertas > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {alertas} producto{alertas === 1 ? '' : 's'} en o por debajo del stock mínimo.
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {isAdmin && (
          <Select value={sucursalId} onValueChange={setSucursalId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todas las sucursales" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las sucursales</SelectItem>
              {sucursales.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Input placeholder="Buscar producto…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <Button variant={soloAlertas ? 'default' : 'outline'} size="sm" onClick={() => setSoloAlertas((v) => !v)}>
          <AlertTriangle className="h-3.5 w-3.5" /> Solo alertas
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Boxes} title="Sin registros de inventario" description="Agrega productos al inventario de la sucursal." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Stock actual</TableHead>
              <TableHead>Stock mínimo</TableHead>
              <TableHead className="min-w-32">Nivel</TableHead>
              <TableHead>Costo unitario</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => {
              const bajo = item.cantidad_actual <= item.stock_minimo
              const nivel = item.stock_minimo > 0 ? Math.min(100, (item.cantidad_actual / (item.stock_minimo * 2)) * 100) : 100
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.producto.nombre}</TableCell>
                  <TableCell>
                    {formatNumber(item.cantidad_actual)} {item.producto.unidad}
                  </TableCell>
                  <TableCell>
                    {formatNumber(item.stock_minimo)} {item.producto.unidad}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={nivel} className="h-1.5 w-20" indicatorClassName={bajo ? 'bg-destructive' : undefined} />
                      {bajo && <Badge variant="destructive">Bajo</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(item.costo_unitario)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditing(item)
                            setFormOpen(true)
                          }}
                        >
                          <Pencil /> Editar
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(item)}>
                            <Trash2 /> Eliminar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      {canManage && (
        <InventarioFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          sucursalId={sucursalId || usuario?.sucursal_id || ''}
          registro={editing}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar del inventario"
        description={`¿Eliminar "${deleting?.producto.nombre}" del inventario de esta sucursal?`}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id)
          setDeleting(null)
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
