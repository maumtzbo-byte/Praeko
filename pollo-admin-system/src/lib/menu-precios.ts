/**
 * Precios fijos del menú usados en "Operación del día" del reporte diario.
 * IMPORTANTE: deben coincidir exactamente con la columna generada
 * `operacion_total` de la migración 0008_operacion_dia_productos.sql —
 * si cambian los precios, hay que actualizar los dos lados.
 */
export const MENU_ITEMS = [
  { key: 'pollo_completo', label: 'Pollo Completo', precio: 219 },
  { key: 'medio_pollo', label: 'Medio Pollo', precio: 120 },
  { key: 'venta_complementos', label: 'Complementos', precio: 45 },
  { key: 'venta_extras', label: 'Extras', precio: 10 },
  { key: 'promo_2x', label: 'Promo 2 pollos', precio: 340 },
  { key: 'promo_1_5', label: 'Promo pollo y medio', precio: 279 },
] as const

/** Aparte porque solo se captura los miércoles. */
export const PROMO_MIERCOLES = { key: 'promo_miercoles', label: 'Promoción Miércoles (pollo y medio)', precio: 219 } as const

export type MenuItemKey = (typeof MENU_ITEMS)[number]['key'] | typeof PROMO_MIERCOLES.key
