import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Copy, Dices } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateUsuario, useRoles } from '@/hooks/use-usuarios'
import { useSucursales } from '@/hooks/use-sucursales'

const schema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  email: z.string().min(1, 'Requerido').email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  rol_id: z.string().min(1, 'Selecciona un rol'),
  sucursal_id: z.string().optional(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

function generarPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function CrearUsuarioDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: roles = [] } = useRoles()
  const { data: sucursales = [] } = useSucursales()
  const mutation = useCreateUsuario()
  const [copied, setCopied] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nombre: '', email: '', password: '', rol_id: '', sucursal_id: undefined },
  })

  React.useEffect(() => {
    if (open) {
      reset({ nombre: '', email: '', password: '', rol_id: '', sucursal_id: undefined })
      setCopied(false)
    }
  }, [open, reset])

  async function handleCopyPassword() {
    const value = watch('password')
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success('Contraseña copiada')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar la contraseña')
    }
  }

  async function onSubmit(values: FormValues) {
    await mutation.mutateAsync({
      nombre: values.nombre,
      email: values.email,
      password: values.password,
      rol_id: Number(values.rol_id),
      sucursal_id: values.sucursal_id ?? null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
          <DialogDescription>
            Se crea la cuenta con esta contraseña temporal; compártela con la persona para que inicie sesión.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input id="nombre" {...register('nombre')} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Contraseña temporal</Label>
            <div className="flex gap-2">
              <Input id="password" {...register('password')} />
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Copiar contraseña"
                onClick={handleCopyPassword}
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Generar contraseña"
                onClick={() => {
                  setValue('password', generarPassword(), { shouldValidate: true })
                  setCopied(false)
                }}
              >
                <Dices className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Usa el botón de copiar para evitar errores al seleccionar el texto manualmente.
            </p>
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Rol</Label>
              <Select value={watch('rol_id')} onValueChange={(v) => setValue('rol_id', v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rol_id && <p className="text-xs text-destructive">{errors.rol_id.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Sucursal</Label>
              <Select value={watch('sucursal_id')} onValueChange={(v) => setValue('sucursal_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creando…' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
