import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreatePedido } from '@/hooks/use-pedidos'
import { useProductos } from '@/hooks/use-productos'
import { useAuth } from '@/context/AuthContext'
import { todayISO } from '@/lib/utils'
import type { PrioridadPedido } from '@/types/database'

const schema = z.object({
  producto_id: z.string().min(1, 'Selecciona un producto'),
  cantidad: z.coerce.number().positive('Debe ser mayor a 0'),
  comentario: z.string().optional(),
  prioridad: z.enum(['baja', 'normal', 'alta', 'urgente']),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function PedidoFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { usuario } = useAuth()
  const { data: productos = [] } = useProductos()
  const mutation = useCreatePedido()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { producto_id: '', cantidad: 1, comentario: '', prioridad: 'normal' },
  })

  React.useEffect(() => {
    if (open) reset({ producto_id: '', cantidad: 1, comentario: '', prioridad: 'normal' })
  }, [open, reset])

  async function onSubmit(values: FormValues) {
    if (!usuario?.sucursal_id) return
    await mutation.mutateAsync({
      sucursal_id: usuario.sucursal_id,
      producto_id: values.producto_id,
      usuario_id: usuario.id,
      cantidad: values.cantidad,
      comentario: values.comentario || null,
      prioridad: values.prioridad,
      fecha: todayISO(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo pedido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label>Producto</Label>
            <Select value={watch('producto_id')} onValueChange={(v) => setValue('producto_id', v)}>
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input id="cantidad" type="number" step="0.01" min="0" {...register('cantidad')} />
              {errors.cantidad && <p className="text-xs text-destructive">{errors.cantidad.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Prioridad</Label>
              <Select value={watch('prioridad')} onValueChange={(v) => setValue('prioridad', v as PrioridadPedido)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comentario">Comentario (opcional)</Label>
            <Textarea id="comentario" rows={2} {...register('comentario')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Enviando…' : 'Enviar pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
