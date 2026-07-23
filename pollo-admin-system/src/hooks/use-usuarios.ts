import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import * as usuariosService from '@/services/usuarios.service'

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
    onError: (err: Error) => toast.error(err.message),
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
    onError: (err: Error) => toast.error(err.message),
  })
}
