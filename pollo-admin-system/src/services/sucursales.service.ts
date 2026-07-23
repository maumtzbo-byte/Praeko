import { supabase } from '@/lib/supabase'
import type { EstadoSucursal, Sucursal } from '@/types/database'

export interface SucursalInput {
  nombre: string
  direccion: string
  telefono?: string | null
  responsable?: string | null
  estado: EstadoSucursal
}

export async function listSucursales(): Promise<Sucursal[]> {
  const { data, error } = await supabase.from('sucursales').select('*').order('nombre')
  if (error) throw error
  return data
}

export async function getSucursal(id: string): Promise<Sucursal> {
  const { data, error } = await supabase.from('sucursales').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createSucursal(input: SucursalInput): Promise<Sucursal> {
  const { data, error } = await supabase.from('sucursales').insert(input).select().single()
  if (error) throw error
  return data
}

export async function updateSucursal(id: string, input: Partial<SucursalInput>): Promise<Sucursal> {
  const { data, error } = await supabase.from('sucursales').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteSucursal(id: string): Promise<void> {
  const { error } = await supabase.from('sucursales').delete().eq('id', id)
  if (error) throw error
}
