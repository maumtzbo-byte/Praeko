import { createClient } from '@supabase/supabase-js'

// .trim() guards against a stray newline/space from copy-pasting the value
// into a host's env var UI, which would otherwise produce a URL that fails
// the client's own validation.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

// createClient can throw synchronously (e.g. an invalid URL). Since this
// module is imported before React ever renders, an uncaught throw here
// would blank the entire page with no error message. Always fall back to
// a placeholder client instead — callers check `isSupabaseConfigured` and
// render a setup screen rather than letting requests hit the placeholder.
function initSupabase() {
  try {
    return {
      client: createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-anon-key', {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      }),
      configured: Boolean(supabaseUrl && supabaseAnonKey),
    }
  } catch (error) {
    console.error('No se pudo inicializar el cliente de Supabase:', error)
    return {
      client: createClient('https://placeholder.supabase.co', 'placeholder-anon-key'),
      configured: false,
    }
  }
}

const { client, configured } = initSupabase()

export const supabase = client
export const isSupabaseConfigured = configured
