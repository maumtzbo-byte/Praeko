import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateMerma } from '@/hooks/use-mermas'
import { useAuth } from '@/context/AuthContext'
import { todayISO } from '@/lib/utils'

const schema = z.object({
  producto_nombre: z.string().min(1, 'Requerido'),
  cantidad: z.coerce.number().positive('Debe ser mayor a 0'),
  motivo: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function MermaFormDialog({ open, onOpenChange, sucursalId }: { open: boolean; onOpenChange: (open: boolean) => void; sucursalId: string }) {
  const { usuario } = useAuth()
  const mutation = useCreateMerma()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { producto_nombre: '', cantidad: 1, motivo: '', fecha: todayISO() },
  })

  React.useEffect(() => {
    if (open) reset({ producto_nombre: '', cantidad: 1, motivo: '', fecha: todayISO() })
  }, [open, reset])

  async function onSubmit(values: FormValues) {
    if (!usuario) return
    await mutation.mutateAsync({
      sucursal_id: sucursalId,
      producto_nombre: values.producto_nombre,
      usuario_id: usuario.id,
      cantidad: values.cantidad,
      motivo: values.motivo,
      fecha: values.fecha,
      observaciones: null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar merma</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="producto_nombre">Producto</Label>
            <Input id="producto_nombre" placeholder="Ej. Pollo completo" {...register('producto_nombre')} />
            {errors.producto_nombre && <p className="text-xs text-destructive">{errors.producto_nombre.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" max={todayISO()} {...register('fecha')} />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input id="cantidad" type="number" step="0.01" min="0" {...register('cantidad')} />
              {errors.cantidad && <p className="text-xs text-destructive">{errors.cantidad.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motivo">Motivo</Label>
            <Input id="motivo" placeholder="Ej. Se cayó en el piso" {...register('motivo')} />
            {errors.motivo && <p className="text-xs text-destructive">{errors.motivo.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Registrar merma'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
