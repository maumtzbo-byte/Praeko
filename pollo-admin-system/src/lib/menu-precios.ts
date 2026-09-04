/**
 * Precios fijos del menú usados en "Operación del día" del reporte diario.
 * IMPORTANTE: deben coincidir exactamente con la columna generada
 * `operacion_total` de la migración 0014_reportes_diarios_complementos_extras_desglosados.sql —
 * si cambian los precios, hay que actualizar los dos lados.
 */
export const MENU_ITEMS = [
  { key: 'pollo_completo', label: 'Pollo Completo', precio: 219 },
  { key: 'medio_pollo', label: 'Medio Pollo', precio: 120 },
  { key: 'complementos_frijoles', label: 'Frijoles', precio: 45 },
  { key: 'complementos_salchicha', label: 'Salchicha', precio: 45 },
  { key: 'complementos_coditos', label: 'Coditos', precio: 45 },
  { key: 'complementos_arroz', label: 'Arroz', precio: 45 },
  { key: 'complementos_cebolla', label: 'Cebolla', precio: 45 },
  { key: 'extras_totopos', label: 'Totopos', precio: 10 },
  { key: 'extras_salsas', label: 'Salsas', precio: 10 },
  { key: 'extras_tortillas', label: 'Tortillas', precio: 10 },
  { key: 'promo_2x', label: 'Promo 2 pollos', precio: 340 },
  { key: 'promo_1_5', label: 'Promo pollo y medio', precio: 279 },
] as const

/** Aparte porque solo se captura los miércoles. */
export const PROMO_MIERCOLES = { key: 'promo_miercoles', label: 'Promoción Miércoles (pollo y medio)', precio: 219 } as const

export type MenuItemKey = (typeof MENU_ITEMS)[number]['key'] | typeof PROMO_MIERCOLES.key

/** Pollo Completo y Medio Pollo. */
export const POLLO_ITEMS = MENU_ITEMS.filter((item) => item.key === 'pollo_completo' || item.key === 'medio_pollo')

/** Los 5 productos de "Complementos" ($45 c/u). */
export const COMPLEMENTOS_ITEMS = MENU_ITEMS.filter((item) => item.key.startsWith('complementos_'))

/** Los 3 productos de "Extras" ($10 c/u). */
export const EXTRAS_ITEMS = MENU_ITEMS.filter((item) => item.key.startsWith('extras_'))

/** Promo 2 pollos y Promo pollo y medio. */
export const PROMO_ITEMS = MENU_ITEMS.filter((item) => item.key === 'promo_2x' || item.key === 'promo_1_5')
