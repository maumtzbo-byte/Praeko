import * as React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth, RequireRole } from '@/routes/ProtectedRoute'
import { isSupabaseConfigured } from '@/lib/supabase'
import { SetupRequiredPage } from '@/pages/SetupRequiredPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { PageLoader } from '@/components/shared/PageLoader'

const DashboardPage = React.lazy(() => import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const SucursalesPage = React.lazy(() => import('@/pages/sucursales/SucursalesPage').then((m) => ({ default: m.SucursalesPage })))
const ReporteDiarioPage = React.lazy(() =>
  import('@/pages/reportes-diarios/ReporteDiarioPage').then((m) => ({ default: m.ReporteDiarioPage })),
)
const GastosPage = React.lazy(() => import('@/pages/gastos/GastosPage').then((m) => ({ default: m.GastosPage })))
const InventarioPage = React.lazy(() => import('@/pages/inventario/InventarioPage').then((m) => ({ default: m.InventarioPage })))
const ProductosPage = React.lazy(() => import('@/pages/productos/ProductosPage').then((m) => ({ default: m.ProductosPage })))
const PedidosPage = React.lazy(() => import('@/pages/pedidos/PedidosPage').then((m) => ({ default: m.PedidosPage })))
const MermasPage = React.lazy(() => import('@/pages/mermas/MermasPage').then((m) => ({ default: m.MermasPage })))
const NotificacionesPage = React.lazy(() =>
  import('@/pages/notificaciones/NotificacionesPage').then((m) => ({ default: m.NotificacionesPage })),
)
const ReportesPage = React.lazy(() => import('@/pages/reportes/ReportesPage').then((m) => ({ default: m.ReportesPage })))
const HistorialPage = React.lazy(() => import('@/pages/historial/HistorialPage').then((m) => ({ default: m.HistorialPage })))
const EquipoPage = React.lazy(() => import('@/pages/equipo/EquipoPage').then((m) => ({ default: m.EquipoPage })))
const PerfilPage = React.lazy(() => import('@/pages/perfil/PerfilPage').then((m) => ({ default: m.PerfilPage })))
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

export function AppRoutes() {
  if (!isSupabaseConfigured) {
    return (
      <Routes>
        <Route path="*" element={<SetupRequiredPage />} />
      </Routes>
    )
  }

  return (
    <React.Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reportes-diarios" element={<ReporteDiarioPage />} />
            <Route path="/gastos" element={<GastosPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/pedidos" element={<PedidosPage />} />
            <Route path="/mermas" element={<MermasPage />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
            <Route path="/perfil" element={<PerfilPage />} />

            <Route element={<RequireRole roles={['administrador']} />}>
              <Route path="/sucursales" element={<SucursalesPage />} />
              <Route path="/equipo" element={<EquipoPage />} />
            </Route>

            <Route element={<RequireRole roles={['administrador', 'encargado']} />}>
              <Route path="/productos" element={<ProductosPage />} />
              <Route path="/reportes" element={<ReportesPage />} />
              <Route path="/historial" element={<HistorialPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </React.Suspense>
  )
}
