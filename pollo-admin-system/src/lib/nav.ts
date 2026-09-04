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
  /** Agrupa los ítems del menú para que no se sientan como una lista plana. */
  section: 'Hoy' | 'Análisis' | 'Administración'
}

export const NAV_SECTIONS = ['Hoy', 'Análisis', 'Administración'] as const

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, roles: ['administrador', 'encargado', 'empleado'], section: 'Hoy' },
  { label: 'Reporte diario', to: '/reportes-diarios', icon: ClipboardList, roles: ['administrador', 'encargado', 'empleado'], section: 'Hoy' },
  { label: 'Pedidos', to: '/pedidos', icon: Truck, roles: ['administrador', 'encargado', 'empleado'], section: 'Hoy' },
  { label: 'Inventario', to: '/inventario', icon: Boxes, roles: ['administrador', 'encargado', 'empleado'], section: 'Hoy' },
  { label: 'Mermas', to: '/mermas', icon: Trash2, roles: ['administrador', 'encargado', 'empleado'], section: 'Hoy' },
  { label: 'Gastos fijos', to: '/gastos', icon: Receipt, roles: ['administrador', 'encargado', 'empleado'], section: 'Hoy' },
  { label: 'Notificaciones', to: '/notificaciones', icon: Bell, roles: ['administrador', 'encargado', 'empleado'], section: 'Hoy' },

  { label: 'Historial de reportes', to: '/reportes', icon: FileBarChart, roles: ['administrador', 'encargado'], section: 'Análisis' },
  { label: 'Auditoría', to: '/historial', icon: History, roles: ['administrador', 'encargado'], section: 'Análisis' },

  { label: 'Sucursales', to: '/sucursales', icon: Store, roles: ['administrador'], section: 'Administración' },
  { label: 'Productos', to: '/productos', icon: Package, roles: ['administrador', 'encargado'], section: 'Administración' },
  { label: 'Equipo', to: '/equipo', icon: Users, roles: ['administrador'], section: 'Administración' },
]
