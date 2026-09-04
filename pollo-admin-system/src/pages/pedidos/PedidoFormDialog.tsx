import * as React from 'react'
import { RotateCcw } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreatePedidoLote, usePedidos } from '@/hooks/use-pedidos'
import { useProductos } from '@/hooks/use-productos'
import { useAuth } from '@/context/AuthContext'
import { formatDate, todayISO } from '@/lib/utils'
import type { PrioridadPedido } from '@/types/database'

const CATEGORIAS = ['Complementos', 'Insumos'] as const

export function PedidoFormDialog({
  open,
  onOpenChange,
  sucursalId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursalId: string
}) {
  const { usuario } = useAuth()
  const { data: productos = [] } = useProductos()
  const { data: historico = [] } = usePedidos(sucursalId)
  const mutation = useCreatePedidoLote()

  const [cantidades, setCantidades] = React.useState<Record<string, string>>({})
  const [prioridad, setPrioridad] = React.useState<PrioridadPedido>('normal')
  const [comentario, setComentario] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (open) {
      setCantidades({})
      setPrioridad('normal')
      setComentario('')
      setError(null)
    }
  }, [open])

  // Fecha del pedido más reciente (que no sea hoy), para poder "repetirlo".
  const fechaAnterior = React.useMemo(() => {
    const fechas = historico.map((p) => p.fecha).filter((f) => f !== todayISO())
    return fechas.length > 0 ? fechas.reduce((max, f) => (f > max ? f : max)) : null
  }, [historico])

  function repetirPedidoAnterior() {
    if (!fechaAnterior) return
    setCantidades((prev) => {
      const nuevas = { ...prev }
      for (const p of historico) {
        if (p.fecha !== fechaAnterior) continue
        const actual = Number(nuevas[p.producto_id] ?? 0)
        nuevas[p.producto_id] = String(actual + Number(p.cantidad))
      }
      return nuevas
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!usuario) return

    const seleccionados = Object.entries(cantidades)
      .map(([producto_id, cantidad]) => ({ producto_id, cantidad: Number(cantidad) }))
      .filter((item) => Number.isFinite(item.cantidad) && item.cantidad > 0)

    if (seleccionados.length === 0) {
      setError('Selecciona al menos un artículo con cantidad.')
      return
    }
    setError(null)

    await mutation.mutateAsync(
      seleccionados.map((item) => ({
        sucursal_id: sucursalId,
        producto_id: item.producto_id,
        usuario_id: usuario.id,
        cantidad: item.cantidad,
        comentario: comentario || null,
        prioridad,
        fecha: todayISO(),
      })),
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo pedido</DialogTitle>
        </DialogHeader>
        {fechaAnterior && (
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={repetirPedidoAnterior}>
            <RotateCcw /> Repetir pedido del {formatDate(fechaAnterior)}
          </Button>
        )}
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Tabs defaultValue="Complementos">
            <TabsList className="w-full">
              {CATEGORIAS.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
            {CATEGORIAS.map((cat) => (
              <TabsContent key={cat} value={cat} className="flex flex-col gap-2">
                {productos
                  .filter((p) => p.activo && p.categoria?.nombre === cat)
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3">
                      <Label htmlFor={`cant-${p.id}`} className="min-w-0 flex-1 truncate font-normal">
                        {p.nombre} <span className="text-muted-foreground">({p.unidad})</span>
                      </Label>
                      <Input
                        id={`cant-${p.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        className="w-24"
                        value={cantidades[p.id] ?? ''}
                        onChange={(e) => setCantidades((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      />
                    </div>
                  ))}
              </TabsContent>
            ))}
          </Tabs>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Prioridad</Label>
              <Select value={prioridad} onValueChange={(v) => setPrioridad(v as PrioridadPedido)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comentario">Comentario (opcional)</Label>
            <Textarea id="comentario" rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Enviando…' : 'Enviar pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
