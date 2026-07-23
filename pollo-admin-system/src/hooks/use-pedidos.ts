import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getFriendlyErrorMessage } from '@/lib/error-messages'
import * as pedidosService from '@/services/pedidos.service'
import type { PedidoInput } from '@/services/pedidos.service'
import type { EstadoPedido } from '@/types/database'

export function usePedidos(sucursalId?: string) {
  return useQuery({
    queryKey: ['pedidos', sucursalId ?? 'todas'],
    queryFn: () => pedidosService.listPedidos(sucursalId),
  })
}

export function useCreatePedido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: PedidoInput) => pedidosService.createPedido(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Pedido enviado')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useUpdateEstadoPedido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoPedido }) =>
      pedidosService.updateEstadoPedido(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Estado del pedido actualizado')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useDeletePedido() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pedidosService.deletePedido(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Pedido eliminado')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}
