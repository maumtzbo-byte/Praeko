import * as React from 'react'
import { MoreHorizontal, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDeleteProducto, useProductos } from '@/hooks/use-productos'
import { useCategorias } from '@/hooks/use-categorias'
import { useDebounce } from '@/hooks/use-debounce'
import { ProductoFormDialog } from '@/pages/productos/ProductoFormDialog'
import { CategoriasPanel } from '@/pages/productos/CategoriasPanel'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/lib/utils'
import type { ProductoConCategoria } from '@/types/database'

export function ProductosPage() {
  const { isAdmin } = useAuth()
  const { data: productos = [], isLoading } = useProductos()
  const { data: categorias = [] } = useCategorias()
  const deleteMutation = useDeleteProducto()

  const [search, setSearch] = React.useState('')
  const debouncedSearch = useDebounce(search, 200)
  const [categoriaFiltro, setCategoriaFiltro] = React.useState('todas')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ProductoConCategoria | null>(null)
  const [deleting, setDeleting] = React.useState<ProductoConCategoria | null>(null)

  const filtered = productos.filter((p) => {
    const matchesSearch = p.nombre.toLowerCase().includes(debouncedSearch.toLowerCase())
    const matchesCategoria = categoriaFiltro === 'todas' || p.categoria_id === categoriaFiltro
    return matchesSearch && matchesCategoria
  })

  return (
    <div>
      <PageHeader
        title="Productos"
        description="Catálogo de productos disponibles para venta e inventario"
        actions={
          <Button
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus /> Nuevo producto
          </Button>
        }
      />

      <Tabs defaultValue="productos">
        <TabsList>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>

        <TabsContent value="productos">
          <div className="mb-4 flex flex-wrap gap-2">
            <Input
              placeholder="Buscar producto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las categorías</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <Skeleton className="h-64" />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Package} title="No hay productos" description="Agrega tu primer producto al catálogo." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Costo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nombre}</TableCell>
                    <TableCell>{p.categoria?.nombre ?? '—'}</TableCell>
                    <TableCell className="capitalize">{p.unidad}</TableCell>
                    <TableCell>{formatCurrency(p.precio_venta)}</TableCell>
                    <TableCell>{formatCurrency(p.costo)}</TableCell>
                    <TableCell>
                      <Badge variant={p.activo ? 'success' : 'secondary'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(p)
                              setFormOpen(true)
                            }}
                          >
                            <Pencil /> Editar
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleting(p)}>
                              <Trash2 /> Eliminar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        <TabsContent value="categorias">
          <CategoriasPanel />
        </TabsContent>
      </Tabs>

      <ProductoFormDialog open={formOpen} onOpenChange={setFormOpen} producto={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Eliminar producto"
        description={`¿Seguro que deseas eliminar "${deleting?.nombre}"?`}
        onConfirm={() => {
          if (deleting) deleteMutation.mutate(deleting.id)
          setDeleting(null)
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
