import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ClipboardList } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useReporteDelDia, useUpsertReporteDiario } from '@/hooks/use-reportes'
import { useSucursales } from '@/hooks/use-sucursales'
import { useResumenMermasDelDia } from '@/hooks/use-mermas'
import { useGastosTotal } from '@/hooks/use-gastos'
import { useAuth } from '@/context/AuthContext'
import { COMPLEMENTOS_ITEMS, EXTRAS_ITEMS, MENU_ITEMS, POLLO_ITEMS, PROMO_ITEMS, PROMO_MIERCOLES } from '@/lib/menu-precios'
import { calcularVentasNetas } from '@/lib/comisiones'
import { cn, formatCurrency, todayISO } from '@/lib/utils'
import { GastosDelDiaSection } from '@/pages/reportes-diarios/GastosDelDiaSection'

const schema = z.object({
  vta_sucursal: z.coerce.number().min(0),
  tarjeta: z.coerce.number().min(0),
  deposito: z.coerce.number().min(0),
  didi: z.coerce.number().min(0),
  rappi: z.coerce.number().min(0),
  uber: z.coerce.number().min(0),
  pollo_completo: z.coerce.number().min(0),
  medio_pollo: z.coerce.number().min(0),
  complementos_frijoles: z.coerce.number().min(0),
  complementos_salchicha: z.coerce.number().min(0),
  complementos_coditos: z.coerce.number().min(0),
  complementos_arroz: z.coerce.number().min(0),
  complementos_cebolla: z.coerce.number().min(0),
  extras_totopos: z.coerce.number().min(0),
  extras_salsas: z.coerce.number().min(0),
  extras_tortillas: z.coerce.number().min(0),
  promo_2x: z.coerce.number().min(0),
  promo_1_5: z.coerce.number().min(0),
  promo_miercoles: z.coerce.number().min(0),
  recolecto: z.string().min(1, 'Es necesario poner el nombre'),
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
  pollo_completo: 0,
  medio_pollo: 0,
  complementos_frijoles: 0,
  complementos_salchicha: 0,
  complementos_coditos: 0,
  complementos_arroz: 0,
  complementos_cebolla: 0,
  extras_totopos: 0,
  extras_salsas: 0,
  extras_tortillas: 0,
  promo_2x: 0,
  promo_1_5: 0,
  promo_miercoles: 0,
  recolecto: '',
}

export function ReporteDiarioPage() {
  const { usuario, isAdmin } = useAuth()
  const { data: sucursales = [] } = useSucursales()

  const [sucursalId, setSucursalId] = React.useState(usuario?.sucursal_id ?? '')
  const [fecha, setFecha] = React.useState(todayISO())
  const [pendingValues, setPendingValues] = React.useState<FormValues | null>(null)

  React.useEffect(() => {
    if (!isAdmin && usuario?.sucursal_id) setSucursalId(usuario.sucursal_id)
  }, [isAdmin, usuario])

  // El admin no tiene una sucursal propia: en cuanto carga la lista, se le
  // asigna la primera para que pueda empezar a capturar de inmediato (y
  // luego cambiar de sucursal con el selector de arriba).
  React.useEffect(() => {
    if (isAdmin && !sucursalId && sucursales.length > 0) setSucursalId(sucursales[0].id)
  }, [isAdmin, sucursalId, sucursales])

  const esMiercoles = new Date(`${fecha}T00:00:00`).getDay() === 3

  const { data: reporte, isLoading } = useReporteDelDia(sucursalId, fecha)
  const mutation = useUpsertReporteDiario()

  // Los gastos normales del día se capturan abajo, en esta misma página; los
  // gastos fijos (renta, sueldos) van aparte y no cuentan aquí. Productos
  // dañados y merma se calculan solos con lo capturado en Mermas ese día.
  const { data: gastosTotal = 0 } = useGastosTotal({ sucursalId, desde: fecha, hasta: fecha, tipo: 'normal' })
  const { data: resumenMermas = { productosDanados: 0, mermaTotal: 0 } } = useResumenMermasDelDia(sucursalId, fecha)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
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
              pollo_completo: reporte.pollo_completo,
              medio_pollo: reporte.medio_pollo,
              complementos_frijoles: reporte.complementos_frijoles,
              complementos_salchicha: reporte.complementos_salchicha,
              complementos_coditos: reporte.complementos_coditos,
              complementos_arroz: reporte.complementos_arroz,
              complementos_cebolla: reporte.complementos_cebolla,
              extras_totopos: reporte.extras_totopos,
              extras_salsas: reporte.extras_salsas,
              extras_tortillas: reporte.extras_tortillas,
              promo_2x: reporte.promo_2x,
              promo_1_5: reporte.promo_1_5,
              promo_miercoles: reporte.promo_miercoles,
              recolecto: reporte.recolecto ?? '',
            }
          : EMPTY,
      )
    }
  }, [reporte, isLoading, reset])

  // Si ya se guardó un reporte hoy pero después cambió el total de Gastos o
  // se registró una merma nueva, el total calculado se adelanta a lo que
  // quedó guardado hasta que se le vuelva a dar clic a "Actualizar reporte".
  const cambiosSinGuardar = reporte
    ? reporte.gastos_total !== gastosTotal ||
      reporte.productos_danados !== resumenMermas.productosDanados ||
      reporte.merma_total !== resumenMermas.mermaTotal
    : gastosTotal > 0 || resumenMermas.productosDanados > 0 || resumenMermas.mermaTotal > 0

  const values = watch()
  const ventasTotales =
    Number(values.vta_sucursal || 0) +
    Number(values.tarjeta || 0) +
    Number(values.deposito || 0) +
    Number(values.didi || 0) +
    Number(values.rappi || 0) +
    Number(values.uber || 0)
  // No es ventasTotales - gastosTotal: DiDi/Uber/Rappi cobran comisión, así
  // que la ganancia real descuenta eso primero (ver src/lib/comisiones.ts).
  const ventasNetas = calcularVentasNetas({
    vta_sucursal: Number(values.vta_sucursal || 0),
    tarjeta: Number(values.tarjeta || 0),
    deposito: Number(values.deposito || 0),
    didi: Number(values.didi || 0),
    rappi: Number(values.rappi || 0),
    uber: Number(values.uber || 0),
  })
  const gananciaEstimada = ventasNetas - gastosTotal

  const operacionTotal =
    MENU_ITEMS.reduce((sum, item) => sum + Number(values[item.key] || 0) * item.precio, 0) +
    (esMiercoles ? Number(values.promo_miercoles || 0) * PROMO_MIERCOLES.precio : 0)

  // "Pollos vendidos" se deriva de lo capturado (medio pollo cuenta 0.5, las
  // promos de pollo y medio cuentan 1.5) para las estadísticas del dashboard.
  const pollosVendidosEquivalente = Math.round(
    Number(values.pollo_completo || 0) +
      Number(values.medio_pollo || 0) * 0.5 +
      Number(values.promo_2x || 0) * 2 +
      Number(values.promo_1_5 || 0) * 1.5 +
      (esMiercoles ? Number(values.promo_miercoles || 0) * 1.5 : 0),
  )

  const diferenciaCuadre = operacionTotal - ventasTotales
  const descuadre = Math.abs(diferenciaCuadre) > 1
  const diferenciaCuadreTexto = descuadre
    ? diferenciaCuadre > 0
      ? `Faltan ${formatCurrency(diferenciaCuadre)} en método de pago para que cuadre con Operación del día.`
      : `Sobran ${formatCurrency(Math.abs(diferenciaCuadre))} en método de pago respecto a Operación del día.`
    : null

  async function guardarReporte(formValues: FormValues) {
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
      gastos_total: gastosTotal,
      pollos_recibidos: 0,
      pollos_vendidos: pollosVendidosEquivalente,
      productos_danados: resumenMermas.productosDanados,
      merma_total: resumenMermas.mermaTotal,
      pollo_completo: formValues.pollo_completo,
      medio_pollo: formValues.medio_pollo,
      complementos_frijoles: formValues.complementos_frijoles,
      complementos_salchicha: formValues.complementos_salchicha,
      complementos_coditos: formValues.complementos_coditos,
      complementos_arroz: formValues.complementos_arroz,
      complementos_cebolla: formValues.complementos_cebolla,
      extras_totopos: formValues.extras_totopos,
      extras_salsas: formValues.extras_salsas,
      extras_tortillas: formValues.extras_tortillas,
      promo_2x: formValues.promo_2x,
      promo_1_5: formValues.promo_1_5,
      promo_miercoles: esMiercoles ? formValues.promo_miercoles : 0,
      observaciones: reporte?.observaciones ?? null,
      notas: reporte?.notas ?? null,
      recolecto: formValues.recolecto,
    })
    setPendingValues(null)
  }

  async function onValidSubmit(formValues: FormValues) {
    if (descuadre) {
      setPendingValues(formValues)
      return
    }
    await guardarReporte(formValues)
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
        description="Captura las ventas del día. Al guardar, tu administrador ya lo puede ver en Historial de reportes."
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

      <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
        <fieldset
          disabled={isLoading}
          className={cn('flex flex-col gap-6', isLoading && 'pointer-events-none opacity-60')}
        >
        <Card>
          <CardHeader>
            <CardTitle>Operación del día</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {POLLO_ITEMS.map((item) => (
                <div key={item.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={item.key}>{item.label}</Label>
                  <Input id={item.key} type="number" step="1" min="0" {...register(item.key)} />
                </div>
              ))}
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Complementos ($45 c/u)</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {COMPLEMENTOS_ITEMS.map((item) => (
                  <div key={item.key} className="flex flex-col gap-1.5">
                    <Label htmlFor={item.key}>{item.label}</Label>
                    <Input id={item.key} type="number" step="1" min="0" {...register(item.key)} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Extras ($10 c/u)</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {EXTRAS_ITEMS.map((item) => (
                  <div key={item.key} className="flex flex-col gap-1.5">
                    <Label htmlFor={item.key}>{item.label}</Label>
                    <Input id={item.key} type="number" step="1" min="0" {...register(item.key)} />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Promociones</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {PROMO_ITEMS.map((item) => (
                  <div key={item.key} className="flex flex-col gap-1.5">
                    <Label htmlFor={item.key}>{item.label}</Label>
                    <Input id={item.key} type="number" step="1" min="0" {...register(item.key)} />
                  </div>
                ))}
                {esMiercoles && (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="promo_miercoles">{PROMO_MIERCOLES.label}</Label>
                    <Input id="promo_miercoles" type="number" step="1" min="0" {...register('promo_miercoles')} />
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Total por productos: <span className="font-semibold text-foreground">{formatCurrency(operacionTotal)}</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas por método de pago</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vta_sucursal">Efectivo</Label>
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
              {errors.recolecto && <p className="text-xs text-destructive">{errors.recolecto.message}</p>}
            </div>
          </CardContent>
        </Card>

        <GastosDelDiaSection sucursalId={sucursalId} fecha={fecha} />

        {cambiosSinGuardar && (
          <p className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-foreground">
            Hay gastos o mermas más recientes que el reporte guardado — dale a{' '}
            {reporte ? '"Actualizar reporte"' : '"Guardar reporte"'} para que los totales queden al día.
          </p>
        )}

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-xs text-muted-foreground">Ventas totales</p>
                <p className="text-xl font-semibold">{formatCurrency(ventasTotales)}</p>
                {diferenciaCuadreTexto && (
                  <p className="mt-1 text-xs font-medium text-destructive">{diferenciaCuadreTexto}</p>
                )}
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

      <ConfirmDialog
        open={Boolean(pendingValues)}
        onOpenChange={(open) => !open && setPendingValues(null)}
        title="Las cifras no coinciden"
        description={`Los productos vendidos suman ${formatCurrency(operacionTotal)}, pero los métodos de pago suman ${formatCurrency(ventasTotales)}. ${diferenciaCuadreTexto ?? ''} Puedes revisar los números antes de guardar, o continuar de todas formas — si avanzas, se le avisará al administrador que este reporte no cuadró.`}
        confirmLabel="Avanzar de todas formas"
        destructive={false}
        onConfirm={() => pendingValues && guardarReporte(pendingValues)}
        isLoading={mutation.isPending}
      />
    </div>
  )
}
