import { supabase } from '@/lib/supabase'
import type { Rol, UsuarioConRelaciones } from '@/types/database'

export async function listUsuarios(): Promise<UsuarioConRelaciones[]> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, rol:roles(*), sucursal:sucursales(*)')
    .order('nombre')
  if (error) throw error
  return data as UsuarioConRelaciones[]
}

export async function listRoles(): Promise<Rol[]> {
  const { data, error } = await supabase.from('roles').select('*').order('id')
  if (error) throw error
  return data
}

export async function updateUsuarioEstado(id: string, estado: 'activo' | 'inactivo') {
  const { data, error } = await supabase.from('usuarios').update({ estado }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function updateUsuarioSucursal(id: string, sucursal_id: string | null) {
  const { data, error } = await supabase
    .from('usuarios')
    .update({ sucursal_id })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export interface MiPerfilInput {
  nombre: string
  telefono?: string | null
}

export async function updateMiPerfil(id: string, input: MiPerfilInput) {
  const { data, error } = await supabase.from('usuarios').update(input).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function updateMiPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
