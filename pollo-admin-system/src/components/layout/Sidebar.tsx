import { NavLink } from 'react-router-dom'
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
              'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors before:absolute before:-left-3 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary before:transition-opacity',
              isActive
                ? 'bg-primary/10 text-primary before:opacity-100'
                : 'text-muted-foreground before:opacity-0 hover:bg-sidebar-foreground/5 hover:text-foreground',
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
      <img src="/mascota.png" alt="Pimpollo" className="h-9 w-9 shrink-0 object-contain" />
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
