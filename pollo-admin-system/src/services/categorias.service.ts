import { supabase } from '@/lib/supabase'
import type { Categoria } from '@/types/database'

export interface CategoriaInput {
  nombre: string
  descripcion?: string | null
}

export async function listCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase.from('categorias').select('*').order('nombre')
  if (error) throw error
  return data
}

export async function createCategoria(input: CategoriaInput): Promise<Categoria> {
  const { data, error } = await supabase.from('categorias').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateCategoria(id: string, input: Partial<CategoriaInput>): Promise<Categoria> {
  const { data, error } = await supabase.from('categorias').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteCategoria(id: string): Promise<void> {
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw error
}
