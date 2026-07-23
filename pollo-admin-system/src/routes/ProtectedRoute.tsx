import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { RolClave } from '@/types/database'
import { FullScreenLoader } from '@/components/shared/FullScreenLoader'

export function RequireAuth() {
  const { session, usuario, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullScreenLoader />

  if (!session) return <Navigate to="/login" state={{ from: location }} replace />

  if (!usuario) return <FullScreenLoader label="Cargando tu perfil…" />

  if (usuario.estado === 'inactivo') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-lg font-semibold">Tu cuenta está inactiva</p>
        <p className="text-sm text-muted-foreground">
          Contacta a un administrador para reactivar tu acceso al sistema.
        </p>
      </div>
    )
  }

  return <Outlet />
}

export function RequireRole({ roles }: { roles: RolClave[] }) {
  const { usuario } = useAuth()
  if (!usuario) return <FullScreenLoader />

  if (!roles.includes(usuario.rol.clave)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
