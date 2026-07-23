import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHART_COLORS } from '@/lib/chart-colors'
import { formatCurrency } from '@/lib/utils'
import type { ComparativoSucursal } from '@/services/dashboard.service'

export function BranchComparisonChart({ data }: { data: ComparativoSucursal[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparación entre sucursales</CardTitle>
      </CardHeader>
      <CardContent className="h-80 pl-0 sm:pl-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis dataKey="nombre" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              tickFormatter={(v: number) => formatCurrency(v).replace('MX$', '$')}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--popover)', fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="ventas" name="Ventas" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
            <Bar dataKey="gastos" name="Gastos" fill={CHART_COLORS.warning} radius={[6, 6, 0, 0]} />
            <Bar dataKey="ganancia" name="Ganancia" fill={CHART_COLORS.success} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
