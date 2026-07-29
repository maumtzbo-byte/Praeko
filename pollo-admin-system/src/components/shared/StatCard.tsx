import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  icon?: LucideIcon
  iconImage?: string
  trend?: number
  /** Texto de comparación, ej. "vs. ayer". */
  trendLabel?: string
  /** Se muestra en gris cuando no hay periodo anterior con qué comparar. */
  trendEmptyLabel?: string
  /** Para métricas donde subir es malo (ej. gastos): invierte el color del %. */
  invertTrendColor?: boolean
  tone?: 'default' | 'success' | 'warning' | 'destructive'
  className?: string
  isLoading?: boolean
}

const TONE_STYLES: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/20 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
}

export function StatCard({
  label,
  value,
  icon: Icon,
  iconImage,
  trend,
  trendLabel = 'vs. periodo anterior',
  trendEmptyLabel,
  invertTrendColor = false,
  tone = 'default',
  className,
  isLoading,
}: StatCardProps) {
  const trendEsPositivo = trend !== undefined && (invertTrendColor ? trend < 0 : trend >= 0)
  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {isLoading ? (
            <Skeleton className="mt-1.5 h-7 w-24" />
          ) : (
            <p className="mt-1.5 break-words text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
              {value}
            </p>
          )}
          {!isLoading && trend !== undefined && (
            <div
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 text-xs font-medium',
                trendEsPositivo ? 'text-success' : 'text-destructive',
              )}
            >
              {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {trend >= 0 ? '+' : '−'}
              {Math.abs(trend).toFixed(1)}% {trendLabel}
            </div>
          )}
          {!isLoading && trend === undefined && trendEmptyLabel && (
            <p className="mt-1.5 text-xs text-muted-foreground">{trendEmptyLabel}</p>
          )}
        </div>
        {iconImage ? (
          <img src={iconImage} alt="" className="h-12 w-12 shrink-0 object-contain" />
        ) : (
          Icon && (
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', TONE_STYLES[tone])}>
              <Icon className="h-5 w-5" />
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}
