import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getFriendlyErrorMessage } from '@/lib/error-messages'
import * as ventasService from '@/services/ventas.service'
import type { VentaInput } from '@/services/ventas.service'

export function useVentasDelDia(sucursalId: string | undefined, fecha: string) {
  return useQuery({
    queryKey: ['ventas', 'del-dia', sucursalId, fecha],
    queryFn: () => ventasService.listVentasPorFecha(sucursalId as string, fecha),
    enabled: Boolean(sucursalId),
  })
}

export function usePollosVendidosDelDia(sucursalId: string | undefined, fecha: string) {
  return useQuery({
    queryKey: ['ventas', 'pollos-del-dia', sucursalId, fecha],
    queryFn: () => ventasService.getPollosVendidosDelDia(sucursalId as string, fecha),
    enabled: Boolean(sucursalId),
  })
}

export function useCreateVenta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VentaInput) => ventasService.createVenta(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Venta registrada')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useDeleteVenta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ventasService.deleteVenta(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Venta eliminada')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}
