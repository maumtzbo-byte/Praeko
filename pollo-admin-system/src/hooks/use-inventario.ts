import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getFriendlyErrorMessage } from '@/lib/error-messages'
import * as inventarioService from '@/services/inventario.service'
import type { InventarioInput } from '@/services/inventario.service'

export function useInventario(sucursalId?: string) {
  return useQuery({
    queryKey: ['inventario', sucursalId ?? 'todas'],
    queryFn: () => inventarioService.listInventario(sucursalId),
  })
}

export function useUpsertInventario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: InventarioInput) => inventarioService.upsertInventario(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario'] })
      qc.invalidateQueries({ queryKey: ['notificaciones'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Inventario actualizado')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useUpdateInventarioCantidad() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, cantidad }: { id: string; cantidad: number }) =>
      inventarioService.updateInventarioCantidad(id, cantidad),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario'] })
      qc.invalidateQueries({ queryKey: ['notificaciones'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Cantidad actualizada')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useDeleteInventario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => inventarioService.deleteInventario(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario'] })
      qc.invalidateQueries({ queryKey: ['notificaciones'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Registro eliminado')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}
