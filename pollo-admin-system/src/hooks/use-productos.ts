import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as productosService from '@/services/productos.service'
import type { ProductoInput } from '@/services/productos.service'

const KEY = ['productos'] as const

export function useProductos() {
  return useQuery({ queryKey: KEY, queryFn: productosService.listProductos })
}

export function useCreateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductoInput) => productosService.createProducto(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Producto creado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useUpdateProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductoInput> }) =>
      productosService.updateProducto(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Producto actualizado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteProducto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => productosService.deleteProducto(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Producto eliminado')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
