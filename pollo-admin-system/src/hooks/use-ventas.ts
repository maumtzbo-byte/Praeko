import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as ventasService from '@/services/ventas.service'
import type { VentaInput } from '@/services/ventas.service'

export function useVentasPorReporte(reporteId: string | undefined) {
  return useQuery({
    queryKey: ['ventas', reporteId],
    queryFn: () => ventasService.listVentasPorReporte(reporteId as string),
    enabled: Boolean(reporteId),
  })
}

export function useCreateVenta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: VentaInput) => ventasService.createVenta(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas'] })
      toast.success('Venta registrada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteVenta() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => ventasService.deleteVenta(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ventas'] })
      toast.success('Venta eliminada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
