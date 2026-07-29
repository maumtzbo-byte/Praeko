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
import { usePollosVendidosDelDia } from '@/hooks/use-ventas'
import { useResumenMermasDelDia } from '@/hooks/use-mermas'
import { useAuth } from '@/context/AuthContext'
import { VentasDetalleSection } from '@/pages/reportes-diarios/VentasDetalleSection'
import { cn, formatCurrency, formatNumber, todayISO } from '@/lib/utils'

const schema = z.object({
  vta_sucursal: z.coerce.number().min(0),
  tarjeta: z.coerce.number().min(0),
  deposito: z.coerce.number().min(0),
  didi: z.coerce.number().min(0),
  rappi: z.coerce.number().min(0),
  uber: z.coerce.number().min(0),
  gastos_total: z.coerce.number().min(0),
  pollos_recibidos: z.coerce.number().min(0),
  observaciones: z.string().optional(),
  notas: z.string().optional(),
  recolecto: z.string().optional(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

const EMPTY: FormInput = {
  vta_sucursal: 0,
  tarjeta: 0,
  deposito: 0,
  didi: 0,
  rappi: 0,
  uber: 0,
  gastos_total: 0,
  pollos_recibidos: 0,
  observaciones: '',
  notas: '',
  recolecto: '',
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

  // Se calculan solos a partir de Ventas y Mermas, ya no se escriben a mano.
  const { data: pollosVendidos = 0 } = usePollosVendidosDelDia(sucursalId, fecha)
  const { data: resumenMermas = { productosDanados: 0, mermaTotal: 0 } } = useResumenMermasDelDia(sucursalId, fecha)

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
              vta_sucursal: reporte.vta_sucursal,
              tarjeta: reporte.tarjeta,
              deposito: reporte.deposito,
              didi: reporte.didi,
              rappi: reporte.rappi,
              uber: reporte.uber,
              gastos_total: reporte.gastos_total,
              pollos_recibidos: reporte.pollos_recibidos,
              observaciones: reporte.observaciones ?? '',
              notas: reporte.notas ?? '',
              recolecto: reporte.recolecto ?? '',
            }
          : EMPTY,
      )
    }
  }, [reporte, isLoading, reset])

  // Si ya se guardó un reporte hoy pero después se agregó/quitó una venta o
  // merma, los totales calculados se adelantan a lo que quedó guardado hasta
  // que se le vuelva a dar clic a "Actualizar reporte".
  const cambiosSinGuardar = reporte
    ? reporte.pollos_vendidos !== pollosVendidos ||
      reporte.productos_danados !== resumenMermas.productosDanados ||
      reporte.merma_total !== resumenMermas.mermaTotal
    : pollosVendidos > 0 || resumenMermas.productosDanados > 0 || resumenMermas.mermaTotal > 0

  const values = watch()
  const ventasTotales =
    Number(values.vta_sucursal || 0) +
    Number(values.tarjeta || 0) +
    Number(values.deposito || 0) +
    Number(values.didi || 0) +
    Number(values.rappi || 0) +
    Number(values.uber || 0)
  const gananciaEstimada = ventasTotales - Number(values.gastos_total || 0)

  async function onSubmit(formValues: FormValues) {
    if (!usuario || !sucursalId) return
    await mutation.mutateAsync({
      sucursal_id: sucursalId,
      usuario_id: usuario.id,
      fecha,
      vta_sucursal: formValues.vta_sucursal,
      tarjeta: formValues.tarjeta,
      deposito: formValues.deposito,
      didi: formValues.didi,
      rappi: formValues.rappi,
      uber: formValues.uber,
      gastos_total: formValues.gastos_total,
      pollos_recibidos: formValues.pollos_recibidos,
      pollos_vendidos: pollosVendidos,
      productos_danados: resumenMermas.productosDanados,
      merma_total: resumenMermas.mermaTotal,
      observaciones: formValues.observaciones || null,
      notas: formValues.notas || null,
      recolecto: formValues.recolecto || null,
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
        description="Captura las ventas, gastos y movimientos del día. Al guardar, tu administrador ya lo puede ver en Historial de reportes."
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

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset
          disabled={isLoading}
          className={cn('flex flex-col gap-6', isLoading && 'pointer-events-none opacity-60')}
        >
        <Card>
          <CardHeader>
            <CardTitle>Ventas por método de pago</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vta_sucursal">Vta sucursal</Label>
                <Input id="vta_sucursal" type="number" step="0.01" min="0" {...register('vta_sucursal')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="tarjeta">Tarjeta</Label>
                <Input id="tarjeta" type="number" step="0.01" min="0" {...register('tarjeta')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="deposito">Depósito</Label>
                <Input id="deposito" type="number" step="0.01" min="0" {...register('deposito')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="didi">DiDi</Label>
                <Input id="didi" type="number" step="0.01" min="0" {...register('didi')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rappi">Rappi</Label>
                <Input id="rappi" type="number" step="0.01" min="0" {...register('rappi')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="uber">Uber</Label>
                <Input id="uber" type="number" step="0.01" min="0" {...register('uber')} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:w-64">
              <Label htmlFor="recolecto">Recolectó</Label>
              <Input id="recolecto" type="text" placeholder="Nombre de quién recolectó" {...register('recolecto')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operación del día</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
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
              <Input id="pollos_vendidos" disabled value={formatNumber(pollosVendidos)} />
              <p className="text-xs text-muted-foreground">Se calcula solo con lo capturado en Ventas.</p>
              {pollosVendidos > Number(values.pollos_recibidos || 0) && (
                <p className="text-xs text-warning-foreground">
                  Vendiste más pollos de los que recibiste hoy. Revisa si es correcto.
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="productos_danados">Productos dañados</Label>
              <Input id="productos_danados" disabled value={formatNumber(resumenMermas.productosDanados)} />
              <p className="text-xs text-muted-foreground">Se calcula solo con lo capturado en Mermas.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="merma_total">Merma (unidades)</Label>
              <Input id="merma_total" disabled value={formatNumber(resumenMermas.mermaTotal)} />
              <p className="text-xs text-muted-foreground">Se calcula solo con lo capturado en Mermas.</p>
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

        {cambiosSinGuardar && (
          <p className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
            Hay ventas o mermas más recientes que el reporte guardado — dale a{' '}
            {reporte ? '"Actualizar reporte"' : '"Guardar reporte"'} para que los totales queden al día.
          </p>
        )}

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
        </fieldset>
      </form>

      <div className="mt-6">
        <VentasDetalleSection reporteId={reporte?.id ?? null} sucursalId={sucursalId} fecha={fecha} />
      </div>
    </div>
  )
}
