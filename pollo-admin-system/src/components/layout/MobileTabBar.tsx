import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Boxes, Truck, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Inicio', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Reporte', to: '/reportes-diarios', icon: ClipboardList },
  { label: 'Inventario', to: '/inventario', icon: Boxes },
  { label: 'Pedidos', to: '/pedidos', icon: Truck },
  { label: 'Alertas', to: '/notificaciones', icon: Bell },
]

export function MobileTabBar() {
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 flex border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground',
            )
          }
        >
          <tab.icon className="h-5 w-5" />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
