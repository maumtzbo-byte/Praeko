import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as mermasService from '@/services/mermas.service'
import type { MermaInput } from '@/services/mermas.service'

export function useMermas(sucursalId?: string) {
  return useQuery({
    queryKey: ['mermas', sucursalId ?? 'todas'],
    queryFn: () => mermasService.listMermas(sucursalId),
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
    onError: (err: Error) => toast.error(err.message),
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
    onError: (err: Error) => toast.error(err.message),
  })
}
