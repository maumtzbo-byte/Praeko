import * as React from 'react'
import { ExternalLink, MoreHorizontal, Plus, Receipt, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDeleteGasto, useGastos } from '@/hooks/use-gastos'
import { useSucursales } from '@/hooks/use-sucursales'
import { useAuth } from '@/context/AuthContext'
import { GastoFormDialog } from '@/pages/gastos/GastoFormDialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { GastoConCategoria } from '@/services/gastos.service'

export function GastosPage() {
  const { usuario, isAdmin } = useAuth()
  const { data: sucursales = [] } = useSucursales()

  const [sucursalId, setSucursalId] = React.useState<string>(usuario?.sucursal_id ?? '')
  React.useEffect(() => {
    if (!isAdmin && usuario?.sucursal_id) setSucursalId(usuario.sucursal_id)
  }, [isAdmin, usuario])

  const [desde, setDesde] = React.useState('')
  const [hasta, setHasta] = React.useState('')

  const { data: gastos = [], isLoading } = useGastos({
    sucursalId: sucursalId || undefined,
    desde: desde || undefined,
    hasta: hasta || undefined,
  })
  const deleteMutation = useDeleteGasto()

  const [formOpen, setFormOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState<GastoConCategoria | null>(null)

  const total = gastos.reduce((sum, g) => sum + Number(g.monto), 0)
  const activeSucursal = sucursalId || usuario?.sucursal_id || ''

  return (
    <div>
      <PageHeader
        title="Gastos"
        description={`Total del periodo: ${formatCurrency(total)}`}
        actions={
          activeSucursal && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Registrar gasto
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {isAdmin && (
          <Select value={sucursalId} onValueChange={setSucursalId}>
            <SelectTrigger className="w-48">
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
        <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
        <span className="text-sm text-muted-foreground">a</span>
        <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : gastos.length === 0 ? (
        <EmptyState icon={Receipt} title="Sin gastos registrados" description="Registra el primer gasto de esta sucursal." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Concepto</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Comprobante</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {gastos.map((g) => (
              <TableRow key={g.id}>
                <TableCell>{formatDate(g.fecha)}</TableCell>
                <TableCell className="max-w-56 truncate font-medium">{g.concepto}</TableCell>
                <TableCell>
                  {g.categoria ? <Badge variant="outline">{g.categoria.nombre}</Badge> : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell>{formatCurrency(g.monto)}</TableCell>
                <TableCell>
                  {g.comprobante_url ? (
                    <a
                      href={g.comprobante_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Ver <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
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
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(g)}>
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

      {activeSucursal && <GastoFormDialog open={formOpen} onOpenChange={setFormOpen} sucursalId={activeSucursal} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar gasto"
        description={`¿Eliminar el gasto "${deleting?.concepto}"?`}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id)
          setDeleting(null)
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
