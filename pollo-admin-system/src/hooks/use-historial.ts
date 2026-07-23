import { useQuery } from '@tanstack/react-query'
import * as historialService from '@/services/historial.service'
import type { HistorialFiltro } from '@/services/historial.service'

export function useHistorial(filtro: HistorialFiltro = {}) {
  return useQuery({ queryKey: ['historial', filtro], queryFn: () => historialService.listHistorial(filtro) })
}
