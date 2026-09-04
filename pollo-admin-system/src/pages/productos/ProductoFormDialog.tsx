import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateProducto, useUpdateProducto } from '@/hooks/use-productos'
import { useCategorias } from '@/hooks/use-categorias'
import type { ProductoConCategoria, UnidadProducto } from '@/types/database'

const UNIDADES: UnidadProducto[] = ['pieza', 'kg', 'g', 'litro', 'ml', 'paquete', 'caja', 'bolsa']

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  categoria_id: z.string().optional(),
  unidad: z.enum(['pieza', 'kg', 'g', 'litro', 'ml', 'paquete', 'caja', 'bolsa']),
  precio_venta: z.coerce.number().min(0, 'Debe ser positivo'),
  costo: z.coerce.number().min(0, 'Debe ser positivo'),
  activo: z.boolean(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function ProductoFormDialog({
  open,
  onOpenChange,
  producto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto?: ProductoConCategoria | null
}) {
  const { data: categorias = [] } = useCategorias()
  const createMutation = useCreateProducto()
  const updateMutation = useUpdateProducto()
  const isEditing = Boolean(producto)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', categoria_id: undefined, unidad: 'pieza', precio_venta: 0, costo: 0, activo: true },
  })

  React.useEffect(() => {
    if (open) {
      reset(
        producto
          ? {
              nombre: producto.nombre,
              categoria_id: producto.categoria_id ?? undefined,
              unidad: producto.unidad,
              precio_venta: producto.precio_venta,
              costo: producto.costo,
              activo: producto.activo,
            }
          : { nombre: '', categoria_id: undefined, unidad: 'pieza', precio_venta: 0, costo: 0, activo: true },
      )
    }
  }, [open, producto, reset])

  async function onSubmit(values: FormValues) {
    const input = { ...values, categoria_id: values.categoria_id ?? null }
    if (isEditing && producto) {
      await updateMutation.mutateAsync({ id: producto.id, input })
    } else {
      await createMutation.mutateAsync(input)
    }
    onOpenChange(false)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Categoría</Label>
              <Select value={watch('categoria_id')} onValueChange={(v) => setValue('categoria_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Unidad</Label>
              <Select value={watch('unidad')} onValueChange={(v) => setValue('unidad', v as UnidadProducto)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="precio_venta">Precio de venta</Label>
              <Input id="precio_venta" type="number" step="0.01" min="0" {...register('precio_venta')} />
              {errors.precio_venta && <p className="text-xs text-destructive">{errors.precio_venta.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="costo">Costo</Label>
              <Input id="costo" type="number" step="0.01" min="0" {...register('costo')} />
              {errors.costo && <p className="text-xs text-destructive">{errors.costo.message}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <Label htmlFor="activo" className="cursor-pointer font-normal">
              Producto activo (visible para venta)
            </Label>
            <Switch id="activo" checked={watch('activo')} onCheckedChange={(v) => setValue('activo', v)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
