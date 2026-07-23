import type { LucideIcon } from 'lucide-react'
import { Bell, ClipboardList, History, Package, Truck, Users } from 'lucide-react'
import type { RolClave } from '@/types/database'

export interface GuiaPaso {
  icon: LucideIcon
  titulo: string
  texto: string
}

const PASOS_EMPLEADO: GuiaPaso[] = [
  {
    icon: ClipboardList,
    titulo: '1. Captura tu Reporte diario',
    texto:
      'Cada día entra a "Reporte diario" y anota las ventas, gastos y pollos vendidos. Con darle Guardar es suficiente — no hay que enviarlo a nadie más.',
  },
  {
    icon: History,
    titulo: '2. Tu administrador ya lo ve',
    texto:
      'En cuanto guardas, tu administrador puede verlo en "Historial de reportes". No hace falta avisarle por WhatsApp ni nada — el sistema se lo muestra solo.',
  },
  {
    icon: Package,
    titulo: '3. Actualiza el Inventario',
    texto:
      'Cuando recibas mercancía nueva o se te acabe algo, entra a "Inventario", busca el producto y toca el botón de "···" para editar la cantidad.',
  },
  {
    icon: Truck,
    titulo: '4. ¿Necesitas más producto?',
    texto: 'Usa "Pedidos" para pedir más mercancía — tu administrador lo verá ahí mismo.',
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
    icon: Bell,
    titulo: 'Alertas automáticas',
    texto:
      'Si a alguna sucursal se le baja el stock mínimo o tiene una merma alta, te llega una notificación sola — revisa la campanita arriba.',
  },
  {
    icon: Package,
    titulo: 'Inventario y Pedidos',
    texto: 'Cada sucursal actualiza su propio inventario. Si piden más producto, lo verás en "Pedidos".',
  },
  {
    icon: Users,
    titulo: 'Equipo',
    texto: 'Desde "Equipo" puedes crear cuentas nuevas para tus encargados y empleados, y asignarles su sucursal.',
  },
]

export function getGuiaPasos(rol: RolClave | undefined): GuiaPaso[] {
  return rol === 'administrador' ? PASOS_ADMIN : PASOS_EMPLEADO
}
