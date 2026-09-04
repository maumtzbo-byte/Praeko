import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, User } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import { useUpdateMiPassword, useUpdateMiPerfil } from '@/hooks/use-usuarios'
import { initials } from '@/lib/utils'

const perfilSchema = z.object({
  nombre: z.string().min(2, 'Requerido'),
  telefono: z.string().optional(),
})
type PerfilValues = z.infer<typeof perfilSchema>

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmacion: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((data) => data.password === data.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  })
type PasswordValues = z.infer<typeof passwordSchema>

export function PerfilPage() {
  const { usuario } = useAuth()
  const updatePerfil = useUpdateMiPerfil()
  const updatePassword = useUpdateMiPassword()

  const perfilForm = useForm<PerfilValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: usuario?.nombre ?? '', telefono: usuario?.telefono ?? '' },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirmacion: '' },
  })

  React.useEffect(() => {
    if (usuario) perfilForm.reset({ nombre: usuario.nombre, telefono: usuario.telefono ?? '' })
  }, [usuario, perfilForm])

  if (!usuario) return null

  async function onSubmitPerfil(values: PerfilValues) {
    await updatePerfil.mutateAsync({ nombre: values.nombre, telefono: values.telefono || null })
  }

  async function onSubmitPassword(values: PasswordValues) {
    await updatePassword.mutateAsync(values.password)
    passwordForm.reset({ password: '', confirmacion: '' })
  }

  return (
    <div>
      <PageHeader title="Mi perfil" description="Administra tu información de cuenta y contraseña" />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader className="flex-row items-center gap-4 space-y-0">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-base">{initials(usuario.nombre)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{usuario.nombre}</CardTitle>
              <CardDescription>{usuario.email}</CardDescription>
              <Badge variant="outline" className="mt-1.5 capitalize">
                {usuario.rol.nombre}
                {usuario.sucursal ? ` · ${usuario.sucursal.nombre}` : ''}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Información personal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={perfilForm.handleSubmit(onSubmitPerfil)} className="flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nombre">Nombre completo</Label>
                  <Input id="nombre" {...perfilForm.register('nombre')} />
                  {perfilForm.formState.errors.nombre && (
                    <p className="text-xs text-destructive">{perfilForm.formState.errors.nombre.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input id="telefono" {...perfilForm.register('telefono')} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Correo electrónico</Label>
                <Input value={usuario.email} disabled />
                <p className="text-xs text-muted-foreground">El correo no se puede cambiar desde aquí.</p>
              </div>
              <div>
                <Button type="submit" disabled={updatePerfil.isPending}>
                  {updatePerfil.isPending ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" /> Cambiar contraseña
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input id="password" type="password" {...passwordForm.register('password')} />
                  {passwordForm.formState.errors.password && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="confirmacion">Confirmar contraseña</Label>
                  <Input id="confirmacion" type="password" {...passwordForm.register('confirmacion')} />
                  {passwordForm.formState.errors.confirmacion && (
                    <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmacion.message}</p>
                  )}
                </div>
              </div>
              <div>
                <Button type="submit" variant="outline" disabled={updatePassword.isPending}>
                  {updatePassword.isPending ? 'Actualizando…' : 'Actualizar contraseña'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
