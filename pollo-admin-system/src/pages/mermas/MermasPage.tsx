import * as React from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { MoreHorizontal, PackageX, Plus, Tag, Trash2, TrendingDown } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDeleteMerma, useMermas } from '@/hooks/use-mermas'
import { useAuth } from '@/context/AuthContext'
import { MermaFormDialog } from '@/pages/mermas/MermaFormDialog'
import { CHART_COLORS } from '@/lib/chart-colors'
import { formatDate, formatNumber } from '@/lib/utils'
import type { MermaConProducto } from '@/types/database'

export function MermasPage() {
  const { usuario, isAdmin } = useAuth()
  const { data: mermas = [], isLoading } = useMermas(isAdmin ? undefined : (usuario?.sucursal_id ?? undefined))
  const deleteMutation = useDeleteMerma()

  const [motivoFiltro, setMotivoFiltro] = React.useState('todos')
  const [formOpen, setFormOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState<MermaConProducto | null>(null)

  const filtered = mermas.filter((m) => motivoFiltro === 'todos' || m.motivo === motivoFiltro)

  const totalCantidad = mermas.reduce((sum, m) => sum + Number(m.cantidad), 0)
  const registros = mermas.length

  const porMotivo = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const m of mermas) map.set(m.motivo, (map.get(m.motivo) ?? 0) + Number(m.cantidad))
    return Array.from(map.entries()).map(([motivo, cantidad]) => ({ motivo, cantidad }))
  }, [mermas])

  const motivosUnicos = React.useMemo(
    () => Array.from(new Set(mermas.map((m) => m.motivo))).sort((a, b) => a.localeCompare(b)),
    [mermas],
  )

  const motivoPrincipal = [...porMotivo].sort((a, b) => b.cantidad - a.cantidad)[0]?.motivo ?? '—'

  return (
    <div>
      <PageHeader
        title="Mermas"
        description="Registro y estadísticas de productos perdidos o dañados"
        actions={
          usuario?.sucursal_id && (
            <Button onClick={() => setFormOpen(true)}>
              <Plus /> Registrar merma
            </Button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Registros de merma"
          value={formatNumber(registros)}
          icon={TrendingDown}
          tone="destructive"
          isLoading={isLoading}
        />
        <StatCard
          label="Unidades perdidas"
          value={formatNumber(totalCantidad)}
          icon={PackageX}
          tone="warning"
          isLoading={isLoading}
        />
        <StatCard label="Motivo más frecuente" value={motivoPrincipal} icon={Tag} isLoading={isLoading} />
      </div>

      {porMotivo.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Mermas por motivo</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porMotivo} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="motivo" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--popover)', fontSize: 12 }} />
                <Bar dataKey="cantidad" name="Cantidad" fill={CHART_COLORS.destructive} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <Select value={motivoFiltro} onValueChange={setMotivoFiltro}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los motivos</SelectItem>
            {motivosUnicos.map((motivo) => (
              <SelectItem key={motivo} value={motivo}>
                {motivo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton columns={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={TrendingDown} title="Sin mermas registradas" description="Cuando registres una merma aparecerá aquí." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Observaciones</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{formatDate(m.fecha)}</TableCell>
                <TableCell className="font-medium">{m.producto.nombre}</TableCell>
                <TableCell>
                  {m.cantidad} {m.producto.unidad}
                </TableCell>
                <TableCell>{m.motivo}</TableCell>
                <TableCell className="max-w-56 truncate text-muted-foreground">{m.observaciones ?? '—'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isAdmin && (
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(m)}>
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

      {usuario?.sucursal_id && <MermaFormDialog open={formOpen} onOpenChange={setFormOpen} sucursalId={usuario.sucursal_id} />}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar merma"
        description={`¿Eliminar el registro de merma de "${deleting?.producto.nombre}"?`}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id)
          setDeleting(null)
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
