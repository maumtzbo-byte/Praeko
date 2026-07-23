import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
    onError: (err: Error) => toast.error(err.message),
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
    onError: (err: Error) => toast.error(err.message),
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
    onError: (err: Error) => toast.error(err.message),
  })
}
