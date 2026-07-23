import * as React from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { useCategorias, useCreateCategoria, useDeleteCategoria } from '@/hooks/use-categorias'
import { useAuth } from '@/context/AuthContext'

export function CategoriasPanel() {
  const { isAdmin } = useAuth()
  const { data: categorias = [], isLoading } = useCategorias()
  const createMutation = useCreateCategoria()
  const deleteMutation = useDeleteCategoria()
  const [nombre, setNombre] = React.useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    createMutation.mutate({ nombre: nombre.trim() }, { onSuccess: () => setNombre('') })
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleCreate} className="flex max-w-sm gap-2">
        <Input placeholder="Nueva categoría…" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Button type="submit" disabled={createMutation.isPending}>
          <Plus /> Agregar
        </Button>
      </form>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[52px]" />
          ))}
        </div>
      ) : categorias.length === 0 ? (
        <EmptyState icon={Tag} title="Sin categorías" description="Agrega la primera categoría de producto." />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <span className="text-sm font-medium">{c.nombre}</span>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
