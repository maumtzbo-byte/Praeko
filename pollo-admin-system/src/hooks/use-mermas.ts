import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getFriendlyErrorMessage } from '@/lib/error-messages'
import * as mermasService from '@/services/mermas.service'
import type { MermaInput } from '@/services/mermas.service'

export function useMermas(sucursalId?: string) {
  return useQuery({
    queryKey: ['mermas', sucursalId ?? 'todas'],
    queryFn: () => mermasService.listMermas(sucursalId),
  })
}

export function useResumenMermasDelDia(sucursalId: string | undefined, fecha: string) {
  return useQuery({
    queryKey: ['mermas', 'resumen-del-dia', sucursalId, fecha],
    queryFn: () => mermasService.getResumenMermasDelDia(sucursalId as string, fecha),
    enabled: Boolean(sucursalId),
  })
}

export function useCreateMerma() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MermaInput) => mermasService.createMerma(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mermas'] })
      qc.invalidateQueries({ queryKey: ['notificaciones'] })
      toast.success('Merma registrada')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useDeleteMerma() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => mermasService.deleteMerma(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mermas'] })
      toast.success('Merma eliminada')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}
