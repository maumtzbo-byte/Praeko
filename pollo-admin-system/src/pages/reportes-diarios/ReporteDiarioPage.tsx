import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReporteDelDia, useUpsertReporteDiario } from '@/hooks/use-reportes'
import { useSucursales } from '@/hooks/use-sucursales'
import { useAuth } from '@/context/AuthContext'
import { VentasDetalleSection } from '@/pages/reportes-diarios/VentasDetalleSection'
import { formatCurrency, todayISO } from '@/lib/utils'

const schema = z.object({
  ventas_efectivo: z.coerce.number().min(0),
  ventas_tarjeta: z.coerce.number().min(0),
  ventas_transferencia: z.coerce.number().min(0),
  gastos_total: z.coerce.number().min(0),
  pollos_recibidos: z.coerce.number().min(0),
  pollos_vendidos: z.coerce.number().min(0),
  productos_danados: z.coerce.number().min(0),
  merma_total: z.coerce.number().min(0),
  observaciones: z.string().optional(),
  notas: z.string().optional(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

const EMPTY: FormInput = {
  ventas_efectivo: 0,
  ventas_tarjeta: 0,
  ventas_transferencia: 0,
  gastos_total: 0,
  pollos_recibidos: 0,
  pollos_vendidos: 0,
  productos_danados: 0,
  merma_total: 0,
  observaciones: '',
  notas: '',
}

export function ReporteDiarioPage() {
  const { usuario, isAdmin } = useAuth()
  const { data: sucursales = [] } = useSucursales()

  const [sucursalId, setSucursalId] = React.useState(usuario?.sucursal_id ?? '')
  const [fecha, setFecha] = React.useState(todayISO())

  React.useEffect(() => {
    if (!isAdmin && usuario?.sucursal_id) setSucursalId(usuario.sucursal_id)
  }, [isAdmin, usuario])

  const { data: reporte, isLoading } = useReporteDelDia(sucursalId, fecha)
  const mutation = useUpsertReporteDiario()

  const {
    register,
    handleSubmit,
    reset,
    watch,
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: EMPTY })

  React.useEffect(() => {
    if (!isLoading) {
      reset(
        reporte
          ? {
              ventas_efectivo: reporte.ventas_efectivo,
              ventas_tarjeta: reporte.ventas_tarjeta,
              ventas_transferencia: reporte.ventas_transferencia,
              gastos_total: reporte.gastos_total,
              pollos_recibidos: reporte.pollos_recibidos,
              pollos_vendidos: reporte.pollos_vendidos,
              productos_danados: reporte.productos_danados,
              merma_total: reporte.merma_total,
              observaciones: reporte.observaciones ?? '',
              notas: reporte.notas ?? '',
            }
          : EMPTY,
      )
    }
  }, [reporte, isLoading, reset])

  const values = watch()
  const ventasTotales = Number(values.ventas_efectivo || 0) + Number(values.ventas_tarjeta || 0) + Number(values.ventas_transferencia || 0)
  const gananciaEstimada = ventasTotales - Number(values.gastos_total || 0)

  async function onSubmit(formValues: FormValues) {
    if (!usuario || !sucursalId) return
    await mutation.mutateAsync({
      sucursal_id: sucursalId,
      usuario_id: usuario.id,
      fecha,
      ventas_efectivo: formValues.ventas_efectivo,
      ventas_tarjeta: formValues.ventas_tarjeta,
      ventas_transferencia: formValues.ventas_transferencia,
      gastos_total: formValues.gastos_total,
      pollos_recibidos: formValues.pollos_recibidos,
      pollos_vendidos: formValues.pollos_vendidos,
      productos_danados: formValues.productos_danados,
      merma_total: formValues.merma_total,
      observaciones: formValues.observaciones || null,
      notas: formValues.notas || null,
    })
  }

  if (!sucursalId) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No tienes una sucursal asignada"
        description="Pide a un administrador que te asigne a una sucursal para capturar el reporte diario."
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Reporte diario"
        description="Captura las ventas, gastos y movimientos del día"
        actions={
          <>
            {isAdmin && (
              <Select value={sucursalId} onValueChange={setSucursalId}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sucursales.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full sm:w-40"
              max={todayISO()}
            />
          </>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Ventas por método de pago</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ventas_efectivo">Ventas efectivo</Label>
              <Input id="ventas_efectivo" type="number" step="0.01" min="0" {...register('ventas_efectivo')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ventas_tarjeta">Ventas tarjeta</Label>
              <Input id="ventas_tarjeta" type="number" step="0.01" min="0" {...register('ventas_tarjeta')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ventas_transferencia">Ventas transferencia</Label>
              <Input id="ventas_transferencia" type="number" step="0.01" min="0" {...register('ventas_transferencia')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operación del día</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gastos_total">Gastos</Label>
              <Input id="gastos_total" type="number" step="0.01" min="0" {...register('gastos_total')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pollos_recibidos">Pollos recibidos</Label>
              <Input id="pollos_recibidos" type="number" step="1" min="0" {...register('pollos_recibidos')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pollos_vendidos">Pollos vendidos</Label>
              <Input id="pollos_vendidos" type="number" step="1" min="0" {...register('pollos_vendidos')} />
              {Number(values.pollos_vendidos || 0) > Number(values.pollos_recibidos || 0) && (
                <p className="text-xs text-warning-foreground">
                  Vendiste más pollos de los que recibiste hoy. Revisa si es correcto.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="productos_danados">Productos dañados</Label>
              <Input id="productos_danados" type="number" step="1" min="0" {...register('productos_danados')} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-1">
              <Label htmlFor="merma_total">Merma (unidades)</Label>
              <Input id="merma_total" type="number" step="0.01" min="0" {...register('merma_total')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea id="observaciones" rows={3} {...register('observaciones')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notas">Notas</Label>
              <Textarea id="notas" rows={3} {...register('notas')} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex gap-8">
              <div>
                <p className="text-xs text-muted-foreground">Ventas totales</p>
                <p className="text-xl font-semibold">{formatCurrency(ventasTotales)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ganancia estimada</p>
                <p className={`text-xl font-semibold ${gananciaEstimada >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {formatCurrency(gananciaEstimada)}
                </p>
              </div>
            </div>
            <Button type="submit" size="lg" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : reporte ? 'Actualizar reporte' : 'Guardar reporte'}
            </Button>
          </CardContent>
        </Card>
      </form>

      {reporte && (
        <div className="mt-6">
          <VentasDetalleSection reporteId={reporte.id} sucursalId={sucursalId} fecha={fecha} />
        </div>
      )}
    </div>
  )
}
