import * as React from 'react'
import { MoreHorizontal, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useDeleteSucursal, useSucursales } from '@/hooks/use-sucursales'
import { useDebounce } from '@/hooks/use-debounce'
import { SucursalFormDialog } from '@/pages/sucursales/SucursalFormDialog'
import { formatDateTime } from '@/lib/utils'
import type { Sucursal } from '@/types/database'

export function SucursalesPage() {
  const { data: sucursales = [], isLoading } = useSucursales()
  const deleteMutation = useDeleteSucursal()

  const [search, setSearch] = React.useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Sucursal | null>(null)
  const [deleting, setDeleting] = React.useState<Sucursal | null>(null)

  const filtered = sucursales.filter((s) => {
    const term = debouncedSearch.toLowerCase()
    return s.nombre.toLowerCase().includes(term) || s.direccion.toLowerCase().includes(term)
  })

  return (
    <div>
      <PageHeader
        title="Sucursales"
        description="Administra las ubicaciones de la cadena"
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Nueva sucursal
          </Button>
        }
      />

      <Input
        placeholder="Buscar por nombre o dirección…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-xs"
      />

      {isLoading ? (
        <TableSkeleton columns={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Store} title="No hay sucursales" description="Crea la primera sucursal para comenzar." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Responsable</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Creada</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.nombre}</TableCell>
                <TableCell className="max-w-56 truncate">{s.direccion}</TableCell>
                <TableCell>{s.telefono ?? '—'}</TableCell>
                <TableCell>{s.responsable ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={s.estado === 'activa' ? 'success' : 'secondary'}>
                    {s.estado === 'activa' ? 'Activa' : 'Inactiva'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(s.created_at)}</TableCell>
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
                          setEditing(s)
                          setFormOpen(true)
                        }}
                      >
                        <Pencil /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(s)}>
                        <Trash2 /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <SucursalFormDialog open={formOpen} onOpenChange={setFormOpen} sucursal={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar sucursal"
        description={`¿Seguro que deseas eliminar "${deleting?.nombre}"? Esta acción no se puede deshacer.`}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id)
          setDeleting(null)
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
