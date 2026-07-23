import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as reportesService from '@/services/reportes.service'
import type { ReporteDiarioInput, ReportesFiltro } from '@/services/reportes.service'

export function useReportesDiarios(filtro: ReportesFiltro = {}) {
  return useQuery({
    queryKey: ['reportes-diarios', filtro],
    queryFn: () => reportesService.listReportesDiarios(filtro),
  })
}

export function useReporteDelDia(sucursalId: string | undefined, fecha: string) {
  return useQuery({
    queryKey: ['reporte-del-dia', sucursalId, fecha],
    queryFn: () => reportesService.getReporteDelDia(sucursalId as string, fecha),
    enabled: Boolean(sucursalId),
  })
}

export function useUpsertReporteDiario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ReporteDiarioInput) => reportesService.upsertReporteDiario(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reportes-diarios'] })
      qc.invalidateQueries({ queryKey: ['reporte-del-dia'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Reporte diario guardado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
