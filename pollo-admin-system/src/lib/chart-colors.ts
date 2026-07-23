// Paleta estática (hex) que refleja las variables OKLCH del tema, usada por
// Recharts porque los atributos de presentación SVG no siempre resuelven var().
export const CHART_COLORS = {
  primary: '#c2410c',
  success: '#16a34a',
  info: '#2563eb',
  warning: '#d97706',
  destructive: '#dc2626',
  purple: '#7c3aed',
  muted: '#94a3b8',
} as const

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.purple,
]
