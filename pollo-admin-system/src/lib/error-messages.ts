// Translates common Postgres/Supabase/PostgREST error shapes into short,
// actionable Spanish messages instead of surfacing raw driver text to users.

interface PostgrestLikeError {
  code?: string
  message?: string
  details?: string | null
}

const POSTGRES_CODE_MESSAGES: Record<string, string> = {
  '23505': 'Ya existe un registro con ese valor. Revisa los datos e intenta de nuevo.',
  '23503': 'No se puede completar la acción porque hay información relacionada que depende de este registro.',
  '23514': 'Uno de los valores capturados no es válido.',
  '23502': 'Falta completar un campo obligatorio.',
  '22P02': 'Uno de los valores capturados tiene un formato inválido.',
  PGRST301: 'Tu sesión expiró. Vuelve a iniciar sesión.',
}

function isPostgrestLikeError(error: unknown): error is PostgrestLikeError {
  return typeof error === 'object' && error !== null && ('code' in error || 'message' in error)
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (!isPostgrestLikeError(error)) {
    return 'Ocurrió un error inesperado. Intenta de nuevo.'
  }

  if (error.code && POSTGRES_CODE_MESSAGES[error.code]) {
    return POSTGRES_CODE_MESSAGES[error.code]
  }

  const message = error.message ?? ''

  if (message.includes('row-level security') || message.includes('permission denied')) {
    return 'No tienes permiso para realizar esta acción.'
  }
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('network')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.'
  }
  if (message.includes('JWT') || message.includes('session')) {
    return 'Tu sesión expiró. Vuelve a iniciar sesión.'
  }
  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }

  return message || 'Ocurrió un error inesperado. Intenta de nuevo.'
}
