import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth, RequireRole } from '@/routes/ProtectedRoute'
import { isSupabaseConfigured } from '@/lib/supabase'
import { SetupRequiredPage } from '@/pages/SetupRequiredPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { SucursalesPage } from '@/pages/sucursales/SucursalesPage'
import { ReporteDiarioPage } from '@/pages/reportes-diarios/ReporteDiarioPage'
import { GastosPage } from '@/pages/gastos/GastosPage'
import { InventarioPage } from '@/pages/inventario/InventarioPage'
import { ProductosPage } from '@/pages/productos/ProductosPage'
import { PedidosPage } from '@/pages/pedidos/PedidosPage'
import { MermasPage } from '@/pages/mermas/MermasPage'
import { NotificacionesPage } from '@/pages/notificaciones/NotificacionesPage'
import { ReportesPage } from '@/pages/reportes/ReportesPage'
import { HistorialPage } from '@/pages/historial/HistorialPage'
import { EquipoPage } from '@/pages/equipo/EquipoPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export function AppRoutes() {
  if (!isSupabaseConfigured) {
    return (
      <Routes>
        <Route path="*" element={<SetupRequiredPage />} />
      </Routes>
    )
  }

  return (
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
  )
}
