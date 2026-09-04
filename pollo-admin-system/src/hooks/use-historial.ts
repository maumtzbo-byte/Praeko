import { keepPreviousData, useQuery } from '@tanstack/react-query'
import * as historialService from '@/services/historial.service'
import type { HistorialFiltro } from '@/services/historial.service'

export function useHistorial(
  filtro: HistorialFiltro = {},
  pagina: { page: number; pageSize: number } = { page: 1, pageSize: 25 },
) {
  return useQuery({
    queryKey: ['historial', filtro, pagina],
    queryFn: () => historialService.listHistorial(filtro, pagina),
    placeholderData: keepPreviousData,
  })
}
