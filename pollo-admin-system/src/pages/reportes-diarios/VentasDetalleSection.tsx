import * as React from 'react'
import { Plus, ShoppingBasket, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCreateVenta, useDeleteVenta, useVentasPorReporte } from '@/hooks/use-ventas'
import { useProductos } from '@/hooks/use-productos'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import type { MetodoPago } from '@/types/database'

const METODOS: { value: MetodoPago; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'transferencia', label: 'Transferencia' },
]

export function VentasDetalleSection({
  reporteId,
  sucursalId,
  fecha,
}: {
  reporteId: string
  sucursalId: string
  fecha: string
}) {
  const { usuario } = useAuth()
  const { data: ventas = [] } = useVentasPorReporte(reporteId)
  const { data: productos = [] } = useProductos()
  const createMutation = useCreateVenta()
  const deleteMutation = useDeleteVenta()

  const [productoId, setProductoId] = React.useState('')
  const [cantidad, setCantidad] = React.useState('1')
  const [metodo, setMetodo] = React.useState<MetodoPago>('efectivo')
  const [deleting, setDeleting] = React.useState<(typeof ventas)[number] | null>(null)

  const productoSeleccionado = productos.find((p) => p.id === productoId)
  const cantidadNum = Number(cantidad)
  const cantidadValida = Number.isFinite(cantidadNum) && cantidadNum > 0

  function handleAdd() {
    if (!usuario || !productoSeleccionado || !cantidadValida) return
    createMutation.mutate({
      sucursal_id: sucursalId,
      reporte_id: reporteId,
      producto_id: productoId,
      usuario_id: usuario.id,
      cantidad: cantidadNum,
      precio_unitario: productoSeleccionado.precio_venta,
      metodo_pago: metodo,
      fecha,
    })
    setProductoId('')
    setCantidad('1')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBasket className="h-4 w-4 text-primary" /> Productos vendidos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-44 flex-1">
            <Select value={productoId} onValueChange={setProductoId}>
              <SelectTrigger>
                <SelectValue placeholder="Producto" />
              </SelectTrigger>
              <SelectContent>
                {productos
                  .filter((p) => p.activo)
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} · {formatCurrency(p.precio_venta)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            className="w-24"
            placeholder="Cant."
          />
          <Select value={metodo} onValueChange={(v) => setMetodo(v as MetodoPago)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METODOS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={handleAdd} disabled={!productoId || !cantidadValida || createMutation.isPending}>
            <Plus /> Agregar
          </Button>
        </div>

        {ventas.length === 0 ? (
          <EmptyState icon={ShoppingBasket} title="Sin ventas por producto" description="Agrega los productos vendidos hoy para el detalle." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ventas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.producto?.nombre}</TableCell>
                  <TableCell>
                    {v.cantidad} {v.producto?.unidad}
                  </TableCell>
                  <TableCell>{formatCurrency(v.precio_unitario)}</TableCell>
                  <TableCell>{formatCurrency(v.subtotal)}</TableCell>
                  <TableCell className="capitalize">{v.metodo_pago}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(v)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar venta"
        description={`¿Eliminar la venta de "${deleting?.producto?.nombre ?? 'este producto'}"?`}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id)
          setDeleting(null)
        }}
        isLoading={deleteMutation.isPending}
      />
    </Card>
  )
}
