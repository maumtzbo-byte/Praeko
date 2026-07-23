import { supabase } from '@/lib/supabase'
import type { Notificacion } from '@/types/database'

export async function listNotificaciones(): Promise<Notificacion[]> {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  if (error) throw error
  return data
}

export async function marcarLeida(id: string): Promise<void> {
  const { error } = await supabase.from('notificaciones').update({ leida: true }).eq('id', id)
  if (error) throw error
}

export async function marcarTodasLeidas(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('notificaciones').update({ leida: true }).in('id', ids)
  if (error) throw error
}
