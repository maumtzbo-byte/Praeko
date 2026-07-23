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
import { useCreateMerma } from '@/hooks/use-mermas'
import { useProductos } from '@/hooks/use-productos'
import { useAuth } from '@/context/AuthContext'
import { todayISO } from '@/lib/utils'
import { MOTIVO_MERMA_LABELS } from '@/lib/merma-labels'
import type { MotivoMerma } from '@/types/database'

const schema = z.object({
  producto_id: z.string().min(1, 'Selecciona un producto'),
  cantidad: z.coerce.number().positive('Debe ser mayor a 0'),
  motivo: z.enum(['caducidad', 'dano_fisico', 'mal_manejo', 'transporte', 'refrigeracion', 'otro']),
  fecha: z.string().min(1, 'Requerido'),
  observaciones: z.string().optional(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export function MermaFormDialog({ open, onOpenChange, sucursalId }: { open: boolean; onOpenChange: (open: boolean) => void; sucursalId: string }) {
  const { usuario } = useAuth()
  const { data: productos = [] } = useProductos()
  const mutation = useCreateMerma()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { producto_id: '', cantidad: 1, motivo: 'dano_fisico', fecha: todayISO(), observaciones: '' },
  })

  React.useEffect(() => {
    if (open) reset({ producto_id: '', cantidad: 1, motivo: 'dano_fisico', fecha: todayISO(), observaciones: '' })
  }, [open, reset])

  async function onSubmit(values: FormValues) {
    if (!usuario) return
    await mutation.mutateAsync({
      sucursal_id: sucursalId,
      producto_id: values.producto_id,
      usuario_id: usuario.id,
      cantidad: values.cantidad,
      motivo: values.motivo,
      fecha: values.fecha,
      observaciones: values.observaciones || null,
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input id="cantidad" type="number" step="0.01" min="0" {...register('cantidad')} />
              {errors.cantidad && <p className="text-xs text-destructive">{errors.cantidad.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" {...register('fecha')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Motivo</Label>
            <Select value={watch('motivo')} onValueChange={(v) => setValue('motivo', v as MotivoMerma)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MOTIVO_MERMA_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="observaciones">Observaciones (opcional)</Label>
            <Textarea id="observaciones" rows={2} {...register('observaciones')} />
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
