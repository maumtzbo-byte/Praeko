import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateGasto, useUploadComprobante } from '@/hooks/use-gastos'
import { useAuth } from '@/context/AuthContext'
import { todayISO } from '@/lib/utils'

const schema = z.object({
  monto: z.coerce.number().positive('Debe ser mayor a 0'),
  concepto: z.string().min(2, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

const MAX_COMPROBANTE_BYTES = 5 * 1024 * 1024
const ACCEPTED_COMPROBANTE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

export function GastoFormDialog({
  open,
  onOpenChange,
  sucursalId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursalId: string
}) {
  const { usuario } = useAuth()
  const createMutation = useCreateGasto()
  const uploadMutation = useUploadComprobante()
  const [comprobante, setComprobante] = React.useState<File | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { monto: 0, concepto: '', fecha: todayISO() },
  })

  React.useEffect(() => {
    if (open) {
      reset({ monto: 0, concepto: '', fecha: todayISO() })
      setComprobante(null)
    }
  }, [open, reset])

  async function onSubmit(values: FormValues) {
    if (!usuario) return
    let comprobante_url: string | null = null
    if (comprobante) {
      comprobante_url = await uploadMutation.mutateAsync({ file: comprobante, sucursalId })
    }
    await createMutation.mutateAsync({
      sucursal_id: sucursalId,
      usuario_id: usuario.id,
      categoria_id: null,
      monto: values.monto,
      concepto: values.concepto,
      descripcion: null,
      fecha: values.fecha,
      comprobante_url,
    })
    onOpenChange(false)
  }

  const isPending = createMutation.isPending || uploadMutation.isPending

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!ACCEPTED_COMPROBANTE_TYPES.includes(file.type)) {
      toast.error('Formato no soportado. Usa una imagen (JPG, PNG, WEBP, HEIC) o PDF.')
      return
    }
    if (file.size > MAX_COMPROBANTE_BYTES) {
      toast.error('El archivo supera los 5MB permitidos.')
      return
    }
    setComprobante(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar gasto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" max={todayISO()} {...register('fecha')} />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="monto">Monto</Label>
              <Input id="monto" type="number" step="0.01" min="0" {...register('monto')} />
              {errors.monto && <p className="text-xs text-destructive">{errors.monto.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="concepto">Concepto</Label>
            <Input id="concepto" placeholder="Ej. Compra de carbón" {...register('concepto')} />
            {errors.concepto && <p className="text-xs text-destructive">{errors.concepto.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comprobante">Comprobante (opcional)</Label>
            <label
              htmlFor="comprobante"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent"
            >
              <Paperclip className="h-4 w-4" />
              {comprobante ? comprobante.name : 'Adjuntar imagen del comprobante'}
            </label>
            <input
              id="comprobante"
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-xs text-muted-foreground">Imagen o PDF, máximo 5MB.</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : 'Registrar gasto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
