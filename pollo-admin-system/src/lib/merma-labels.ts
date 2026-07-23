import type { MotivoMerma } from '@/types/database'

export const MOTIVO_MERMA_LABELS: Record<MotivoMerma, string> = {
  caducidad: 'Caducidad',
  dano_fisico: 'Daño físico',
  mal_manejo: 'Mal manejo',
  transporte: 'Transporte',
  refrigeracion: 'Refrigeración',
  otro: 'Otro',
}
