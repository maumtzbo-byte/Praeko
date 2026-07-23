import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Store,
  ClipboardList,
  Receipt,
  Boxes,
  Package,
  Truck,
  Trash2,
  Bell,
  FileBarChart,
  History,
  Users,
} from 'lucide-react'
import type { RolClave } from '@/types/database'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  roles: RolClave[]
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['administrador', 'encargado', 'empleado'] },
  { label: 'Sucursales', to: '/sucursales', icon: Store, roles: ['administrador'] },
  { label: 'Reporte diario', to: '/reportes-diarios', icon: ClipboardList, roles: ['administrador', 'encargado', 'empleado'] },
  { label: 'Gastos', to: '/gastos', icon: Receipt, roles: ['administrador', 'encargado', 'empleado'] },
  { label: 'Inventario', to: '/inventario', icon: Boxes, roles: ['administrador', 'encargado', 'empleado'] },
  { label: 'Productos', to: '/productos', icon: Package, roles: ['administrador', 'encargado'] },
  { label: 'Pedidos', to: '/pedidos', icon: Truck, roles: ['administrador', 'encargado', 'empleado'] },
  { label: 'Mermas', to: '/mermas', icon: Trash2, roles: ['administrador', 'encargado', 'empleado'] },
  { label: 'Notificaciones', to: '/notificaciones', icon: Bell, roles: ['administrador', 'encargado', 'empleado'] },
  { label: 'Historial de reportes', to: '/reportes', icon: FileBarChart, roles: ['administrador', 'encargado'] },
  { label: 'Historial', to: '/historial', icon: History, roles: ['administrador', 'encargado'] },
  { label: 'Equipo', to: '/equipo', icon: Users, roles: ['administrador'] },
]
