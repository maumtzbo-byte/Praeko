import { useAuth } from '@/context/AuthContext'
import { AdminDashboard } from '@/pages/dashboard/AdminDashboard'
import { SucursalDashboard } from '@/pages/dashboard/SucursalDashboard'
import { FullScreenLoader } from '@/components/shared/FullScreenLoader'

export function DashboardPage() {
  const { usuario, isAdmin } = useAuth()

  if (!usuario) return <FullScreenLoader />

  return isAdmin ? <AdminDashboard /> : <SucursalDashboard sucursalId={usuario.sucursal_id} />
}
