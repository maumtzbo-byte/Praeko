import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  ClipboardList,
  History,
  Package,
  Receipt,
  Store,
  Trash2,
  Truck,
  Users,
  Boxes,
  FileBarChart,
} from 'lucide-react'
import type { RolClave } from '@/types/database'

export interface GuiaPaso {
  icon: LucideIcon
  titulo: string
  texto: string
}

const PASOS_EMPLEADO: GuiaPaso[] = [
  {
    icon: ClipboardList,
    titulo: 'Reporte diario',
    texto:
      'Cada día entra aquí y anota las ventas, gastos y pollos vendidos. Con darle Guardar es suficiente — tu administrador ya lo puede ver, no hay que avisarle aparte.',
  },
  {
    icon: Receipt,
    titulo: 'Gastos',
    texto: 'Registra aquí cualquier gasto de la sucursal (gas, hielo, reparaciones). Puedes adjuntar foto del comprobante.',
  },
  {
    icon: Boxes,
    titulo: 'Inventario',
    texto:
      'Muestra las cantidades por producto. Cuando recibas mercancía o se te acabe algo, tócalo y elige "Editar" para actualizar la cantidad.',
  },
  {
    icon: Truck,
    titulo: 'Pedidos',
    texto: 'Si necesitas que te manden más producto, créalo aquí — tu administrador lo verá y le puede dar seguimiento.',
  },
  {
    icon: Trash2,
    titulo: 'Mermas',
    texto: 'Registra aquí producto dañado, caducado o que se perdió, con el motivo — así queda contado y no se pierde de vista.',
  },
  {
    icon: Bell,
    titulo: 'Notificaciones',
    texto: 'La campanita de arriba te avisa sola cuando algo necesita tu atención (por ejemplo, stock bajo).',
  },
]

const PASOS_ENCARGADO: GuiaPaso[] = [
  ...PASOS_EMPLEADO,
  {
    icon: FileBarChart,
    titulo: 'Historial de reportes',
    texto: 'Aquí consultas todos los reportes diarios ya capturados de tu sucursal, por fecha o por empleado.',
  },
  {
    icon: Package,
    titulo: 'Productos',
    texto: 'Administra el catálogo de productos: nombres, precios de venta y costos.',
  },
  {
    icon: History,
    titulo: 'Historial',
    texto: 'Bitácora de cambios — quién creó, editó o borró cada registro, por si necesitas revisar algo.',
  },
]

const PASOS_ADMIN: GuiaPaso[] = [
  {
    icon: ClipboardList,
    titulo: 'Reporte diario vs. Historial de reportes',
    texto:
      '"Reporte diario" es donde cada sucursal captura sus ventas del día. "Historial de reportes" es donde tú consultas todo lo ya capturado, filtrando por sucursal, fecha o empleado.',
  },
  {
    icon: Receipt,
    titulo: 'Gastos',
    texto: 'Revisa los gastos que registra cada sucursal, con su comprobante adjunto si lo subieron.',
  },
  {
    icon: Boxes,
    titulo: 'Inventario y Mermas',
    texto: 'Cada sucursal actualiza su propio stock y registra sus mermas — tú ves alertas de stock bajo y merma alta en el Dashboard.',
  },
  {
    icon: Truck,
    titulo: 'Pedidos',
    texto: 'Cuando una sucursal pide más producto, lo verás aquí y puedes cambiar su estado (aceptado, enviado, recibido…).',
  },
  {
    icon: Bell,
    titulo: 'Notificaciones',
    texto: 'Alertas automáticas de stock bajo o merma alta te llegan solas — revisa la campanita arriba.',
  },
  {
    icon: Package,
    titulo: 'Productos',
    texto: 'El catálogo maestro de productos (nombre, precio, costo) que usan todas las sucursales.',
  },
  {
    icon: Store,
    titulo: 'Sucursales',
    texto: 'Aquí das de alta o edita cada sucursal de la cadena.',
  },
  {
    icon: Users,
    titulo: 'Equipo',
    texto: 'Crea cuentas nuevas para tus encargados y empleados, y asígnales su sucursal y contraseña temporal.',
  },
]

export function getGuiaPasos(rol: RolClave | undefined): GuiaPaso[] {
  if (rol === 'administrador') return PASOS_ADMIN
  if (rol === 'encargado') return PASOS_ENCARGADO
  return PASOS_EMPLEADO
}
