import * as React from 'react'
import { Plus, Users } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpdateUsuarioEstado, useUpdateUsuarioSucursal, useUsuarios } from '@/hooks/use-usuarios'
import { useSucursales } from '@/hooks/use-sucursales'
import { CrearUsuarioDialog } from '@/pages/equipo/CrearUsuarioDialog'
import { initials } from '@/lib/utils'

export function EquipoPage() {
  const { data: usuarios = [], isLoading } = useUsuarios()
  const { data: sucursales = [] } = useSucursales()
  const updateEstado = useUpdateUsuarioEstado()
  const updateSucursal = useUpdateUsuarioSucursal()
  const [formOpen, setFormOpen] = React.useState(false)

  return (
    <div>
      <PageHeader
        title="Equipo"
        description="Usuarios registrados, roles y asignación de sucursal."
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus /> Nuevo usuario
          </Button>
        }
      />

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : usuarios.length === 0 ? (
        <EmptyState icon={Users} title="Sin usuarios" description="Aún no hay usuarios registrados." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Sucursal</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(u.nombre)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.nombre}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {u.rol.nombre}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={u.sucursal_id ?? 'sin_asignar'}
                    onValueChange={(v) => updateSucursal.mutate({ id: u.id, sucursalId: v === 'sin_asignar' ? null : v })}
                  >
                    <SelectTrigger className="h-8 w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin_asignar">Sin asignar</SelectItem>
                      {sucursales.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={u.estado}
                    onValueChange={(v) => updateEstado.mutate({ id: u.id, estado: v as 'activo' | 'inactivo' })}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <Badge variant={u.estado === 'activo' ? 'success' : 'secondary'} className="pointer-events-none">
                        {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <CrearUsuarioDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
