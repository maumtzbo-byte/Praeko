import { useQuery } from '@tanstack/react-query'
import * as dashboardService from '@/services/dashboard.service'
import type { DashboardFiltro } from '@/services/dashboard.service'

export function useDashboardData(filtro: DashboardFiltro) {
  return useQuery({ queryKey: ['dashboard', filtro], queryFn: () => dashboardService.fetchDashboardData(filtro) })
}

export function useComparativoSucursales(desde: string, hasta: string) {
  return useQuery({
    queryKey: ['dashboard', 'comparativo', desde, hasta],
    queryFn: () => dashboardService.fetchComparativoSucursales(desde, hasta),
  })
}
