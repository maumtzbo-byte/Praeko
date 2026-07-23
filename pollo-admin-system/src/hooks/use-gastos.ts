import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getFriendlyErrorMessage } from '@/lib/error-messages'
import * as gastosService from '@/services/gastos.service'
import type { GastoInput, GastosFiltro } from '@/services/gastos.service'

export function useGastos(
  filtro: GastosFiltro = {},
  pagina: { page: number; pageSize: number } = { page: 1, pageSize: 25 },
) {
  return useQuery({
    queryKey: ['gastos', filtro, pagina],
    queryFn: () => gastosService.listGastos(filtro, pagina),
    placeholderData: keepPreviousData,
  })
}

export function useGastosTotal(filtro: GastosFiltro = {}) {
  return useQuery({ queryKey: ['gastos-total', filtro], queryFn: () => gastosService.getGastosTotal(filtro) })
}

export function useCreateGasto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GastoInput) => gastosService.createGasto(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos'] })
      qc.invalidateQueries({ queryKey: ['gastos-total'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Gasto registrado')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useUploadComprobante() {
  return useMutation({
    mutationFn: ({ file, sucursalId }: { file: File; sucursalId: string }) =>
      gastosService.uploadComprobante(file, sucursalId),
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useDeleteGasto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gastosService.deleteGasto(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos'] })
      qc.invalidateQueries({ queryKey: ['gastos-total'] })
      toast.success('Gasto eliminado')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}
