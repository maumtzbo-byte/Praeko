import { BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { cn } from '@/lib/utils'

export function EmptyChartCard({ title, height = 'h-72' }: { title: string; height?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className={cn('flex items-center justify-center', height)}>
        <EmptyState icon={BarChart3} title="Sin datos" description="No hay información para este periodo." />
      </CardContent>
    </Card>
  )
}
