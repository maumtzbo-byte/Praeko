import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as categoriasService from '@/services/categorias.service'
import type { CategoriaInput } from '@/services/categorias.service'

const KEY = ['categorias'] as const

export function useCategorias() {
  return useQuery({ queryKey: KEY, queryFn: categoriasService.listCategorias })
}

export function useCreateCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CategoriaInput) => categoriasService.createCategoria(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Categoría creada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export function useDeleteCategoria() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => categoriasService.deleteCategoria(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      toast.success('Categoría eliminada')
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
