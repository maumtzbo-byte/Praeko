import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { useCreateMerma } from '@/hooks/use-mermas'
import { useProductos } from '@/hooks/use-productos'
import { useAuth } from '@/context/AuthContext'
import { cn, todayISO } from '@/lib/utils'
import type { Producto } from '@/types/database'

const schema = z.object({
  producto_id: z.string().min(1, 'Selecciona un producto'),
  cantidad: z.coerce.number().positive('Debe ser mayor a 0'),
  motivo: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

function ProductoCombobox({
  productos,
  value,
  onChange,
  error,
}: {
  productos: Producto[]
  value: string
  onChange: (id: string) => void
  error?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const selected = productos.find((p) => p.id === value)

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return productos
    return productos.filter((p) => p.nombre.toLowerCase().includes(q))
  }, [productos, query])

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="producto_id">Producto</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <Input
            id="producto_id"
            placeholder="Escribe para buscar un producto…"
            autoComplete="off"
            value={open ? query : (selected?.nombre ?? '')}
            onFocus={() => {
              setQuery(selected?.nombre ?? '')
              setOpen(true)
            }}
            onChange={(e) => {
              setQuery(e.target.value)
              onChange('')
              if (!open) setOpen(true)
            }}
          />
        </PopoverAnchor>
        <PopoverContent
          className="max-h-64 w-[var(--radix-popover-trigger-width)] overflow-y-auto p-1"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {filtered.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Sin resultados</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.id)
                  setQuery('')
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent',
                  p.id === value && 'bg-accent',
                )}
              >
                <span>
                  {p.nombre} <span className="text-muted-foreground">({p.unidad})</span>
                </span>
                {p.id === value && <Check className="h-4 w-4 shrink-0" />}
              </button>
            ))
          )}
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

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
    defaultValues: { producto_id: '', cantidad: 1, motivo: '', fecha: todayISO() },
  })

  React.useEffect(() => {
    if (open) reset({ producto_id: '', cantidad: 1, motivo: '', fecha: todayISO() })
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
          <ProductoCombobox
            productos={productos}
            value={watch('producto_id')}
            onChange={(id) => setValue('producto_id', id, { shouldValidate: true })}
            error={errors.producto_id?.message}
          />

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
