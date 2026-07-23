import type { BadgeProps } from '@/components/ui/badge'
import type { EstadoPedido, PrioridadPedido } from '@/types/database'

export const ESTADO_PEDIDO_LABELS: Record<EstadoPedido, string> = {
  pendiente: 'Pendiente',
  aceptado: 'Aceptado',
  en_preparacion: 'En preparación',
  enviado: 'Enviado',
  recibido: 'Recibido',
  cancelado: 'Cancelado',
}

export const ESTADO_PEDIDO_ORDEN: EstadoPedido[] = [
  'pendiente',
  'aceptado',
  'en_preparacion',
  'enviado',
  'recibido',
  'cancelado',
]

export const ESTADO_PEDIDO_BADGE: Record<EstadoPedido, NonNullable<BadgeProps['variant']>> = {
  pendiente: 'warning',
  aceptado: 'default',
  en_preparacion: 'default',
  enviado: 'secondary',
  recibido: 'success',
  cancelado: 'destructive',
}

export const PRIORIDAD_LABELS: Record<PrioridadPedido, string> = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

export const PRIORIDAD_BADGE: Record<PrioridadPedido, NonNullable<BadgeProps['variant']>> = {
  baja: 'secondary',
  normal: 'outline',
  alta: 'warning',
  urgente: 'destructive',
}
