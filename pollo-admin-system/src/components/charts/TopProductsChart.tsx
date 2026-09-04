import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CHART_PALETTE } from '@/lib/chart-colors'
import { formatAxisCurrency, formatCurrency } from '@/lib/utils'
import type { VentaProductoAgregada } from '@/services/dashboard.service'

export function TopProductsChart({ data }: { data: VentaProductoAgregada[] }) {
  const top = data.slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top productos vendidos</CardTitle>
      </CardHeader>
      <CardContent className="h-80 pl-0 sm:pl-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={top} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
              tickFormatter={formatAxisCurrency}
            />
            <YAxis
              type="category"
              dataKey="nombre"
              tickLine={false}
              axisLine={false}
              width={100}
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
            />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
              contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--popover)', fontSize: 12 }}
            />
            <Bar dataKey="total" name="Ventas" radius={[0, 6, 6, 0]}>
              {top.map((entry, index) => (
                <Cell key={entry.producto_id} fill={CHART_PALETTE[index % CHART_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
