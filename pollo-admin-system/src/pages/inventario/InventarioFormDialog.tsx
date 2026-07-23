import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUpsertInventario } from '@/hooks/use-inventario'
import { useProductos } from '@/hooks/use-productos'
import type { InventarioConProducto } from '@/types/database'

const schema = z.object({
  producto_id: z.string().min(1, 'Selecciona un producto'),
  cantidad_actual: z.coerce.number().min(0, 'Debe ser positivo'),
  stock_minimo: z.coerce.number().min(0, 'Debe ser positivo'),
  costo_unitario: z.coerce.number().min(0, 'Debe ser positivo'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function InventarioFormDialog({
  open,
  onOpenChange,
  sucursalId,
  registro,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursalId: string
  registro?: InventarioConProducto | null
}) {
  const { data: productos = [] } = useProductos()
  const mutation = useUpsertInventario()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { producto_id: '', cantidad_actual: 0, stock_minimo: 0, costo_unitario: 0 },
  })

  React.useEffect(() => {
    if (open) {
      reset(
        registro
          ? {
              producto_id: registro.producto_id,
              cantidad_actual: registro.cantidad_actual,
              stock_minimo: registro.stock_minimo,
              costo_unitario: registro.costo_unitario,
            }
          : { producto_id: '', cantidad_actual: 0, stock_minimo: 0, costo_unitario: 0 },
      )
    }
  }, [open, registro, reset])

  async function onSubmit(values: FormValues) {
    await mutation.mutateAsync({ ...values, sucursal_id: sucursalId })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{registro ? 'Editar inventario' : 'Agregar al inventario'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>Producto</Label>
            <Select
              value={watch('producto_id')}
              onValueChange={(v) => setValue('producto_id', v)}
              disabled={Boolean(registro)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un producto" />
              </SelectTrigger>
              <SelectContent>
                {productos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} ({p.unidad})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.producto_id && <p className="text-xs text-destructive">{errors.producto_id.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cantidad_actual">Stock actual</Label>
              <Input id="cantidad_actual" type="number" step="0.01" min="0" {...register('cantidad_actual')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="stock_minimo">Stock mínimo</Label>
              <Input id="stock_minimo" type="number" step="0.01" min="0" {...register('stock_minimo')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="costo_unitario">Costo unitario</Label>
              <Input id="costo_unitario" type="number" step="0.01" min="0" {...register('costo_unitario')} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
