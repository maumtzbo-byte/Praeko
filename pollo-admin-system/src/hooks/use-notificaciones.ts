import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as notificacionesService from '@/services/notificaciones.service'

export function useNotificaciones() {
  return useQuery({
    queryKey: ['notificaciones'],
    queryFn: notificacionesService.listNotificaciones,
    refetchInterval: 60_000,
  })
}

export function useMarcarLeida() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificacionesService.marcarLeida(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  })
}

export function useMarcarTodasLeidas() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => notificacionesService.marcarTodasLeidas(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  })
}
