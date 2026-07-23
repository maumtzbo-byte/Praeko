import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as gastosService from '@/services/gastos.service'
import type { GastoInput, GastosFiltro } from '@/services/gastos.service'

export function useGastos(filtro: GastosFiltro = {}) {
  return useQuery({ queryKey: ['gastos', filtro], queryFn: () => gastosService.listGastos(filtro) })
}

export function useCreateGasto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: GastoInput) => gastosService.createGasto(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Gasto registrado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUploadComprobante() {
  return useMutation({
    mutationFn: ({ file, sucursalId }: { file: File; sucursalId: string }) =>
      gastosService.uploadComprobante(file, sucursalId),
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteGasto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => gastosService.deleteGasto(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gastos'] })
      toast.success('Gasto eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
