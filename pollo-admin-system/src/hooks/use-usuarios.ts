import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getFriendlyErrorMessage } from '@/lib/error-messages'
import * as usuariosService from '@/services/usuarios.service'
import type { MiPerfilInput } from '@/services/usuarios.service'
import { useAuth } from '@/context/AuthContext'

export function useUsuarios() {
  return useQuery({ queryKey: ['usuarios'], queryFn: usuariosService.listUsuarios })
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: usuariosService.listRoles })
}

export function useUpdateUsuarioEstado() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: 'activo' | 'inactivo' }) =>
      usuariosService.updateUsuarioEstado(id, estado),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Estado del usuario actualizado')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useUpdateUsuarioSucursal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, sucursalId }: { id: string; sucursalId: string | null }) =>
      usuariosService.updateUsuarioSucursal(id, sucursalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Sucursal del usuario actualizada')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useUpdateMiPerfil() {
  const { usuario, refreshUsuario } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: MiPerfilInput) => usuariosService.updateMiPerfil(usuario!.id, input),
    onSuccess: async () => {
      await refreshUsuario()
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Perfil actualizado')
    },
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}

export function useUpdateMiPassword() {
  return useMutation({
    mutationFn: (password: string) => usuariosService.updateMiPassword(password),
    onSuccess: () => toast.success('Contraseña actualizada'),
    onError: (err) => toast.error(getFriendlyErrorMessage(err)),
  })
}
