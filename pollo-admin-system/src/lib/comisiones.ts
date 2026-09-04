/**
 * Comisión de las apps de reparto (DiDi, Uber, Rappi): de cada $100
 * vendidos por esas apps, el negocio solo recibe $65.20 (34.8% de
 * comisión, IVA incluido). Efectivo, Tarjeta y Depósito no tienen comisión.
 *
 * IMPORTANTE: debe coincidir exactamente con la columna generada
 * `ganancia_estimada` de la migración
 * 0015_ganancia_estimada_comisiones_apps.sql — si cambia el porcentaje,
 * hay que actualizar los dos lados.
 */
export const NETO_APPS_REPARTO = 0.652

/** Ventas totales ya descontando la comisión de DiDi/Uber/Rappi. */
export function calcularVentasNetas(params: {
  vta_sucursal: number
  tarjeta: number
  deposito: number
  didi: number
  rappi: number
  uber: number
}): number {
  return (
    params.vta_sucursal +
    params.tarjeta +
    params.deposito +
    (params.didi + params.rappi + params.uber) * NETO_APPS_REPARTO
  )
}
