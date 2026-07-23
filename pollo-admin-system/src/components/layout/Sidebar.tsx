import { NavLink } from 'react-router-dom'
import { Drumstick } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/nav'
import { useAuth } from '@/context/AuthContext'

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { usuario } = useAuth()
  const rol = usuario?.rol?.clave

  const items = NAV_ITEMS.filter((item) => rol && item.roles.includes(rol))

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto scrollbar-thin px-3 py-4">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-sidebar-foreground/5 hover:text-foreground',
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export function SidebarBrand() {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Drumstick className="h-[18px] w-[18px]" />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">Pollo Admin</p>
        <p className="text-[11px] text-muted-foreground">Panel multi-sucursal</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarBrand />
      <SidebarNav />
    </aside>
  )
}
