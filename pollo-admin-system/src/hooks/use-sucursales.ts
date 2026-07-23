import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getFriendlyErrorMessage } from '@/lib/error-messages'
import * as sucursalesService from '@/services/sucursales.service'
import type { SucursalInput } from '@/services/sucursales.service'

const KEY = ['sucursales'] as const

export function useSucursales() {
  return useQuery({ queryKey: KEY, queryFn: sucursalesService.listSucursales })
}

export function useCreateSucursal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SucursalInput) => sucursalesService.createSucursal(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Sucursal creada correctamente')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useUpdateSucursal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<SucursalInput> }) =>
      sucursalesService.updateSucursal(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Sucursal actualizada')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useDeleteSucursal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => sucursalesService.deleteSucursal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Sucursal eliminada')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}
