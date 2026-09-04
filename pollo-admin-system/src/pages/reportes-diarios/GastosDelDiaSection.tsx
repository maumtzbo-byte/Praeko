import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useCreateGasto, useDeleteGasto, useGastosDelDia } from '@/hooks/use-gastos'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import type { Gasto } from '@/types/database'

export function GastosDelDiaSection({ sucursalId, fecha }: { sucursalId: string; fecha: string }) {
  const { usuario } = useAuth()
  const { data: gastos = [], isLoading } = useGastosDelDia(sucursalId, fecha)
  const createMutation = useCreateGasto()
  const deleteMutation = useDeleteGasto()

  const [concepto, setConcepto] = React.useState('')
  const [monto, setMonto] = React.useState('')
  const [deleting, setDeleting] = React.useState<Gasto | null>(null)

  const total = gastos.reduce((sum, g) => sum + Number(g.monto), 0)
  const puedeAgregar = concepto.trim().length > 0 && Number(monto) > 0

  async function agregar() {
    if (!usuario || !puedeAgregar) return
    await createMutation.mutateAsync({
      sucursal_id: sucursalId,
      usuario_id: usuario.id,
      categoria_id: null,
      monto: Number(monto),
      concepto: concepto.trim(),
      descripcion: null,
      fecha,
      comprobante_url: null,
      tipo: 'normal',
    })
    setConcepto('')
    setMonto('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gastos del día</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!isLoading && gastos.length > 0 && (
          <ul className="flex flex-col gap-2">
            {gastos.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{g.concepto}</span>
                <span className="shrink-0 font-medium">{formatCurrency(g.monto)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setDeleting(g)}
                  aria-label="Eliminar gasto"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="gasto-concepto">Concepto</Label>
            <Input
              id="gasto-concepto"
              placeholder="Ej. Cebolla y cilantro"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="gasto-monto">Monto</Label>
            <Input
              id="gasto-monto"
              type="number"
              step="0.01"
              min="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
            />
          </div>
          <Button type="button" onClick={agregar} disabled={!puedeAgregar || createMutation.isPending}>
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Total de gastos del día: <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
        </p>
      </CardContent>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar gasto"
        description={`¿Eliminar el gasto "${deleting?.concepto}"?`}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id)
          setDeleting(null)
        }}
        isLoading={deleteMutation.isPending}
      />
    </Card>
  )
}
