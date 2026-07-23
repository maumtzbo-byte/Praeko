import * as React from 'react'
import { FileBarChart, FileSpreadsheet, FileText, Receipt, TrendingUp, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatCard } from '@/components/shared/StatCard'
import { PaginationControls } from '@/components/shared/PaginationControls'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/shared/TableSkeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReportesDiarios, useReportesTotales } from '@/hooks/use-reportes'
import { listReportesDiariosParaExportar } from '@/services/reportes.service'
import { useSucursales } from '@/hooks/use-sucursales'
import { useUsuarios } from '@/hooks/use-usuarios'
import { useAuth } from '@/context/AuthContext'
import { getRangoPeriodo, PERIODOS, type Periodo } from '@/lib/date-ranges'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { getFriendlyErrorMessage } from '@/lib/error-messages'

const PAGE_SIZE = 25

export function ReportesPage() {
  const { usuario, isAdmin } = useAuth()
  const { data: sucursales = [] } = useSucursales()
  const { data: usuarios = [] } = useUsuarios()

  const [periodo, setPeriodo] = React.useState<Periodo>('mes')
  const [sucursalId, setSucursalId] = React.useState(isAdmin ? 'todas' : (usuario?.sucursal_id ?? 'todas'))
  const [empleadoId, setEmpleadoId] = React.useState('todos')
  const [desde, setDesde] = React.useState('')
  const [hasta, setHasta] = React.useState('')
  const [page, setPage] = React.useState(1)
  const [isExporting, setIsExporting] = React.useState(false)

  const rango = React.useMemo(() => getRangoPeriodo(periodo), [periodo])
  const filtroDesde = desde || rango.desde
  const filtroHasta = hasta || rango.hasta

  const filtro = {
    sucursalId: sucursalId === 'todas' ? undefined : sucursalId,
    usuarioId: empleadoId === 'todos' ? undefined : empleadoId,
    desde: filtroDesde,
    hasta: filtroHasta,
  }

  React.useEffect(() => setPage(1), [periodo, sucursalId, empleadoId, desde, hasta])

  const { data, isLoading } = useReportesDiarios(filtro, { page, pageSize: PAGE_SIZE })
  const { data: totales, isLoading: isLoadingTotales } = useReportesTotales(filtro)
  const reportes = data?.data ?? []

  const nombreSucursal = React.useCallback((id: string) => sucursales.find((s) => s.id === id)?.nombre ?? id, [sucursales])
  const nombreUsuario = React.useCallback((id: string) => usuarios.find((u) => u.id === id)?.nombre ?? '—', [usuarios])

  async function handleExportExcel() {
    setIsExporting(true)
    try {
      const [{ exportReportesExcel }, todos] = await Promise.all([
        import('@/utils/export-excel'),
        listReportesDiariosParaExportar(filtro),
      ])
      exportReportesExcel(todos, nombreSucursal)
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  async function handleExportPDF() {
    setIsExporting(true)
    try {
      const [{ exportReportesPDF }, todos] = await Promise.all([
        import('@/utils/export-pdf'),
        listReportesDiariosParaExportar(filtro),
      ])
      await exportReportesPDF(todos, { titulo: 'Reporte de operaciones', sucursalNombre: nombreSucursal })
    } catch (err) {
      toast.error(getFriendlyErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  const hasResults = (data?.count ?? 0) > 0

  return (
    <div>
      <PageHeader
        title="Historial de reportes"
        description="Aquí consultas los reportes diarios ya capturados por las sucursales, por día, semana, mes, año, sucursal o empleado"
        actions={
          <>
            <Button variant="outline" onClick={handleExportExcel} disabled={!hasResults || isExporting}>
              <FileSpreadsheet /> Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={!hasResults || isExporting}>
              <FileText /> PDF
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select value={sucursalId} onValueChange={setSucursalId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las sucursales</SelectItem>
              {sucursales.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={empleadoId} onValueChange={setEmpleadoId}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Empleado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los empleados</SelectItem>
            {usuarios.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-full sm:w-40" />
          <span className="text-sm text-muted-foreground">a</span>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-full sm:w-40" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Ventas del periodo"
          value={formatCurrency(totales?.ventas ?? 0)}
          icon={Wallet}
          isLoading={isLoadingTotales}
        />
        <StatCard
          label="Gastos del periodo"
          value={formatCurrency(totales?.gastos ?? 0)}
          icon={Receipt}
          tone="warning"
          isLoading={isLoadingTotales}
        />
        <StatCard
          label="Ganancia del periodo"
          value={formatCurrency(totales?.ganancia ?? 0)}
          icon={TrendingUp}
          tone="success"
          isLoading={isLoadingTotales}
        />
      </div>

      {isLoading ? (
        <TableSkeleton columns={7} />
      ) : reportes.length === 0 ? (
        <EmptyState icon={FileBarChart} title="Sin reportes en este rango" description="Ajusta los filtros para ver resultados." />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Registrado por</TableHead>
                <TableHead>Ventas totales</TableHead>
                <TableHead>Gastos</TableHead>
                <TableHead>Ganancia</TableHead>
                <TableHead>Pollos vendidos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportes.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.fecha)}</TableCell>
                  <TableCell>{nombreSucursal(r.sucursal_id)}</TableCell>
                  <TableCell>{nombreUsuario(r.usuario_id)}</TableCell>
                  <TableCell>{formatCurrency(r.ventas_totales)}</TableCell>
                  <TableCell>{formatCurrency(r.gastos_total)}</TableCell>
                  <TableCell className={r.ganancia_estimada >= 0 ? 'text-success' : 'text-destructive'}>
                    {formatCurrency(r.ganancia_estimada)}
                  </TableCell>
                  <TableCell>{r.pollos_vendidos}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls page={page} pageSize={PAGE_SIZE} total={data?.count ?? 0} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
