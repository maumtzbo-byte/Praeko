import * as React from 'react'
import { FileBarChart, FileSpreadsheet, FileText } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { StatCard } from '@/components/shared/StatCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReportesDiarios } from '@/hooks/use-reportes'
import { useSucursales } from '@/hooks/use-sucursales'
import { useUsuarios } from '@/hooks/use-usuarios'
import { useAuth } from '@/context/AuthContext'
import { getRangoPeriodo, PERIODOS, type Periodo } from '@/lib/date-ranges'
import { formatCurrency, formatDate } from '@/lib/utils'

export function ReportesPage() {
  const { usuario, isAdmin } = useAuth()
  const { data: sucursales = [] } = useSucursales()
  const { data: usuarios = [] } = useUsuarios()

  const [periodo, setPeriodo] = React.useState<Periodo>('mes')
  const [sucursalId, setSucursalId] = React.useState(isAdmin ? 'todas' : (usuario?.sucursal_id ?? 'todas'))
  const [empleadoId, setEmpleadoId] = React.useState('todos')
  const [desde, setDesde] = React.useState('')
  const [hasta, setHasta] = React.useState('')

  const rango = React.useMemo(() => getRangoPeriodo(periodo), [periodo])
  const filtroDesde = desde || rango.desde
  const filtroHasta = hasta || rango.hasta

  const { data: reportes = [], isLoading } = useReportesDiarios({
    sucursalId: sucursalId === 'todas' ? undefined : sucursalId,
    desde: filtroDesde,
    hasta: filtroHasta,
  })

  const filtered = reportes.filter((r) => empleadoId === 'todos' || r.usuario_id === empleadoId)

  const nombreSucursal = React.useCallback((id: string) => sucursales.find((s) => s.id === id)?.nombre ?? id, [sucursales])
  const nombreUsuario = React.useCallback((id: string) => usuarios.find((u) => u.id === id)?.nombre ?? '—', [usuarios])

  const totales = React.useMemo(() => {
    const ventas = filtered.reduce((sum, r) => sum + Number(r.ventas_totales), 0)
    const gastos = filtered.reduce((sum, r) => sum + Number(r.gastos_total), 0)
    return { ventas, gastos, ganancia: ventas - gastos }
  }, [filtered])

  async function handleExportExcel() {
    const { exportReportesExcel } = await import('@/utils/export-excel')
    exportReportesExcel(filtered, nombreSucursal)
  }

  async function handleExportPDF() {
    const { exportReportesPDF } = await import('@/utils/export-pdf')
    exportReportesPDF(filtered, { titulo: 'Reporte de operaciones', sucursalNombre: nombreSucursal })
  }

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Consulta histórica por día, semana, mes, año, sucursal o empleado"
        actions={
          <>
            <Button variant="outline" onClick={handleExportExcel} disabled={filtered.length === 0}>
              <FileSpreadsheet /> Excel
            </Button>
            <Button variant="outline" onClick={handleExportPDF} disabled={filtered.length === 0}>
              <FileText /> PDF
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <SelectTrigger className="w-32">
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
            <SelectTrigger className="w-48">
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
          <SelectTrigger className="w-48">
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

        <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
        <span className="self-center text-sm text-muted-foreground">a</span>
        <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Ventas del periodo" value={formatCurrency(totales.ventas)} icon={FileBarChart} />
        <StatCard label="Gastos del periodo" value={formatCurrency(totales.gastos)} icon={FileBarChart} tone="warning" />
        <StatCard label="Ganancia del periodo" value={formatCurrency(totales.ganancia)} icon={FileBarChart} tone="success" />
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FileBarChart} title="Sin reportes en este rango" description="Ajusta los filtros para ver resultados." />
      ) : (
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
            {filtered.map((r) => (
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
      )}
    </div>
  )
}
