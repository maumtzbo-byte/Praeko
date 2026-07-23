import * as React from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UsuarioConRelaciones } from '@/types/database'

interface AuthContextValue {
  session: Session | null
  usuario: UsuarioConRelaciones | null
  isLoading: boolean
  isAdmin: boolean
  isEncargado: boolean
  isEmpleado: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshUsuario: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

async function fetchUsuario(userId: string): Promise<UsuarioConRelaciones | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, rol:roles(*), sucursal:sucursales(*)')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error al cargar el perfil de usuario:', error.message)
    return null
  }
  return data as UsuarioConRelaciones | null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [usuario, setUsuario] = React.useState<UsuarioConRelaciones | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const loadUsuario = React.useCallback(async (userId: string) => {
    const perfil = await fetchUsuario(userId)
    setUsuario(perfil)
  }, [])

  React.useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session?.user) {
        await loadUsuario(data.session.user.id)
      }
      setIsLoading(false)
    })

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      if (newSession?.user) {
        await loadUsuario(newSession.user.id)
      } else {
        setUsuario(null)
      }
      setIsLoading(false)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [loadUsuario])

  const signIn = React.useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut()
    setUsuario(null)
    setSession(null)
  }, [])

  const refreshUsuario = React.useCallback(async () => {
    if (session?.user) await loadUsuario(session.user.id)
  }, [session, loadUsuario])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      session,
      usuario,
      isLoading,
      isAdmin: usuario?.rol?.clave === 'administrador',
      isEncargado: usuario?.rol?.clave === 'encargado',
      isEmpleado: usuario?.rol?.clave === 'empleado',
      signIn,
      signOut,
      refreshUsuario,
    }),
    [session, usuario, isLoading, signIn, signOut, refreshUsuario],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
