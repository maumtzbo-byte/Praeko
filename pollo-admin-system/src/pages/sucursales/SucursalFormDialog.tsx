import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateSucursal, useUpdateSucursal } from '@/hooks/use-sucursales'
import type { Sucursal } from '@/types/database'

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  direccion: z.string().min(4, 'Requerido'),
  telefono: z.string().optional(),
  responsable: z.string().optional(),
  estado: z.enum(['activa', 'inactiva']),
})

type FormValues = z.infer<typeof schema>

export function SucursalFormDialog({
  open,
  onOpenChange,
  sucursal,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursal?: Sucursal | null
}) {
  const createMutation = useCreateSucursal()
  const updateMutation = useUpdateSucursal()
  const isEditing = Boolean(sucursal)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', direccion: '', telefono: '', responsable: '', estado: 'activa' },
  })

  React.useEffect(() => {
    if (open) {
      reset(
        sucursal
          ? {
              nombre: sucursal.nombre,
              direccion: sucursal.direccion,
              telefono: sucursal.telefono ?? '',
              responsable: sucursal.responsable ?? '',
              estado: sucursal.estado,
            }
          : { nombre: '', direccion: '', telefono: '', responsable: '', estado: 'activa' },
      )
    }
  }, [open, sucursal, reset])

  async function onSubmit(values: FormValues) {
    if (isEditing && sucursal) {
      await updateMutation.mutateAsync({ id: sucursal.id, input: values })
    } else {
      await createMutation.mutateAsync(values)
    }
    onOpenChange(false)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar sucursal' : 'Nueva sucursal'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Input id="direccion" {...register('direccion')} />
            {errors.direccion && <p className="text-xs text-destructive">{errors.direccion.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" {...register('telefono')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="responsable">Responsable</Label>
              <Input id="responsable" {...register('responsable')} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Estado</Label>
            <Select value={watch('estado')} onValueChange={(v) => setValue('estado', v as 'activa' | 'inactiva')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="inactiva">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : isEditing ? 'Guardar cambios' : 'Crear sucursal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
