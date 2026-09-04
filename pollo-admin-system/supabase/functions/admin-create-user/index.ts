// Creates a new usuario (auth account + public.usuarios row). Runs server-side
// because it needs the Supabase Auth Admin API, whose service role key must
// never be shipped to the browser. Only callers whose own usuarios.rol is
// "administrador" are allowed to invoke this.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface CreateUserPayload {
  nombre: string
  email: string
  password: string
  rol_id: number
  sucursal_id: string | null
}

function isValidPayload(body: unknown): body is CreateUserPayload {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.nombre === 'string' &&
    b.nombre.trim().length >= 2 &&
    typeof b.email === 'string' &&
    b.email.includes('@') &&
    typeof b.password === 'string' &&
    b.password.length >= 6 &&
    typeof b.rol_id === 'number' &&
    (b.sucursal_id === null || typeof b.sucursal_id === 'string')
  )
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método no permitido' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'No autenticado' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const {
    data: { user: caller },
    error: callerError,
  } = await callerClient.auth.getUser()

  if (callerError || !caller) {
    return jsonResponse({ error: 'No autenticado' }, 401)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  const { data: callerProfile, error: profileError } = await adminClient
    .from('usuarios')
    .select('rol:roles(clave)')
    .eq('id', caller.id)
    .single()

  const callerRole = (callerProfile?.rol as { clave?: string } | null)?.clave

  if (profileError || callerRole !== 'administrador') {
    return jsonResponse({ error: 'No tienes permiso para crear usuarios' }, 403)
  }

  let payload: unknown
  try {
    payload = await req.json()
  } catch {
    return jsonResponse({ error: 'Cuerpo de la solicitud inválido' }, 400)
  }

  if (!isValidPayload(payload)) {
    return jsonResponse({ error: 'Faltan campos requeridos o tienen un formato inválido' }, 400)
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
  })

  if (createError || !created.user) {
    const message = createError?.message.includes('already been registered')
      ? 'Ya existe una cuenta con ese correo.'
      : (createError?.message ?? 'No se pudo crear la cuenta')
    return jsonResponse({ error: message }, 400)
  }

  const { error: insertError } = await adminClient.from('usuarios').insert({
    id: created.user.id,
    nombre: payload.nombre,
    email: payload.email,
    rol_id: payload.rol_id,
    sucursal_id: payload.sucursal_id,
    estado: 'activo',
  })

  if (insertError) {
    // Roll back the auth user so we don't leave an orphaned account without a profile.
    await adminClient.auth.admin.deleteUser(created.user.id)
    return jsonResponse({ error: insertError.message }, 400)
  }

  return jsonResponse({ id: created.user.id }, 200)
})
