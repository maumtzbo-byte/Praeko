/**
 * Genera datos demo completos: usuarios (Auth + tabla usuarios), inventario,
 * reportes diarios, ventas, gastos, pedidos y mermas.
 *
 * Requisitos previos:
 *   1. Haber aplicado supabase/migrations/0001_init_schema.sql
 *   2. Haber aplicado supabase/seed.sql (sucursales, categorías, productos)
 *
 * Uso:
 *   cp .env.example .env   # completa VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
 *   npm run seed
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEMO_PASSWORD = 'Pollo123!'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Faltan variables de entorno. Define VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu archivo .env\n' +
      '(la service role key se obtiene en Supabase → Configuración del proyecto → API).',
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

async function ensureUsuario(params: {
  nombre: string
  email: string
  rolClave: 'administrador' | 'encargado' | 'empleado'
  sucursalId: string | null
  rolesPorClave: Map<string, number>
}) {
  const { nombre, email, rolClave, sucursalId, rolesPorClave } = params

  const { data: existentes } = await supabase.auth.admin.listUsers()
  let authUser = existentes.users.find((u) => u.email === email)

  if (!authUser) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    })
    if (error) throw new Error(`Error creando ${email}: ${error.message}`)
    authUser = data.user
    console.log(`  + Cuenta creada: ${email}`)
  } else {
    console.log(`  · Cuenta ya existía: ${email}`)
  }

  const rolId = rolesPorClave.get(rolClave)
  if (!rolId) throw new Error(`No se encontró el rol "${rolClave}". ¿Aplicaste la migración inicial?`)

  const { error: upsertError } = await supabase.from('usuarios').upsert(
    {
      id: authUser.id,
      nombre,
      email,
      rol_id: rolId,
      sucursal_id: sucursalId,
      estado: 'activo',
    },
    { onConflict: 'id' },
  )
  if (upsertError) throw new Error(`Error creando perfil de ${email}: ${upsertError.message}`)

  return authUser.id
}

async function main() {
  console.log('Sembrando datos demo de Pimpollo…\n')

  const { data: roles, error: rolesError } = await supabase.from('roles').select('id, clave')
  if (rolesError || !roles?.length) {
    throw new Error('No se encontraron roles. Aplica primero supabase/migrations/0001_init_schema.sql')
  }
  const rolesPorClave = new Map(roles.map((r) => [r.clave, r.id as number]))

  const { data: sucursales, error: sucursalesError } = await supabase
    .from('sucursales')
    .select('id, nombre')
    .order('nombre')
  if (sucursalesError || !sucursales?.length) {
    throw new Error('No se encontraron sucursales. Aplica primero supabase/seed.sql')
  }

  const { data: productos, error: productosError } = await supabase.from('productos').select('id, nombre, precio_venta, costo, unidad')
  if (productosError || !productos?.length) {
    throw new Error('No se encontraron productos. Aplica primero supabase/seed.sql')
  }

  const { data: categorias } = await supabase.from('categorias').select('id, nombre')

  console.log('1. Creando usuarios…')
  const adminId = await ensureUsuario({
    nombre: 'Admin General',
    email: 'admin@pollo.com',
    rolClave: 'administrador',
    sucursalId: null,
    rolesPorClave,
  })

  const encargadoNombres = ['María González', 'Carlos Ramírez', 'Ana Torres']
  const encargadoIds: string[] = []
  for (let i = 0; i < sucursales.length; i++) {
    const slug = sucursales[i].nombre.toLowerCase().includes('centro')
      ? 'centro'
      : sucursales[i].nombre.toLowerCase().includes('norte')
        ? 'norte'
        : 'sur'
    const id = await ensureUsuario({
      nombre: encargadoNombres[i] ?? `Encargado ${i + 1}`,
      email: `encargado.${slug}@pollo.com`,
      rolClave: 'encargado',
      sucursalId: sucursales[i].id,
      rolesPorClave,
    })
    encargadoIds.push(id)
  }

  const empleadoNombres = ['Luis Hernández', 'Fernanda Ruiz']
  const empleadoIds: string[] = []
  for (let i = 0; i < empleadoNombres.length; i++) {
    const sucursal = sucursales[i % sucursales.length]
    const id = await ensureUsuario({
      nombre: empleadoNombres[i],
      email: `empleado${i + 1}@pollo.com`,
      rolClave: 'empleado',
      sucursalId: sucursal.id,
      rolesPorClave,
    })
    empleadoIds.push(id)
  }

  console.log('\n2. Sembrando inventario por sucursal…')
  for (const sucursal of sucursales) {
    for (const producto of productos) {
      const stockMinimo = producto.unidad === 'pieza' ? 15 : 10
      const bajoStock = Math.random() < 0.15
      const cantidadActual = bajoStock ? randomBetween(0, stockMinimo * 0.8) : randomBetween(stockMinimo, stockMinimo * 6)

      const { error } = await supabase.from('inventario').upsert(
        {
          sucursal_id: sucursal.id,
          producto_id: producto.id,
          cantidad_actual: cantidadActual,
          stock_minimo: stockMinimo,
          costo_unitario: producto.costo,
        },
        { onConflict: 'sucursal_id,producto_id' },
      )
      if (error) console.error(`  ! Error en inventario ${sucursal.nombre}/${producto.nombre}: ${error.message}`)
    }
  }
  console.log(`  + Inventario creado para ${sucursales.length} sucursales x ${productos.length} productos`)

  console.log('\n3. Sembrando reportes diarios, ventas, gastos, pedidos y mermas (últimos 14 días)…')
  const motivos = ['caducidad', 'dano_fisico', 'mal_manejo', 'transporte', 'refrigeracion', 'otro']
  const prioridades = ['baja', 'normal', 'alta', 'urgente']
  const estadosPedido = ['pendiente', 'aceptado', 'en_preparacion', 'enviado', 'recibido']

  for (let i = 0; i < sucursales.length; i++) {
    const sucursal = sucursales[i]
    const responsableId = encargadoIds[i] ?? adminId

    for (let dias = 13; dias >= 0; dias--) {
      const fecha = isoDaysAgo(dias)

      const ventasEfectivo = randomBetween(1800, 4200)
      const ventasTarjeta = randomBetween(900, 2600)
      const ventasTransferencia = randomBetween(200, 900)
      const gastosTotal = randomBetween(400, 1400)
      const pollosRecibidos = Math.round(randomBetween(20, 60))
      const pollosVendidos = Math.round(randomBetween(15, pollosRecibidos))
      const productosDanados = Math.round(randomBetween(0, 5))
      const mermaTotal = randomBetween(0, 8)

      const { data: reporte, error: reporteError } = await supabase
        .from('reportes_diarios')
        .upsert(
          {
            sucursal_id: sucursal.id,
            usuario_id: responsableId,
            fecha,
            ventas_efectivo: ventasEfectivo,
            ventas_tarjeta: ventasTarjeta,
            ventas_transferencia: ventasTransferencia,
            gastos_total: gastosTotal,
            pollos_recibidos: pollosRecibidos,
            pollos_vendidos: pollosVendidos,
            productos_danados: productosDanados,
            merma_total: mermaTotal,
            observaciones: dias === 0 ? 'Cierre de caja conciliado sin novedades.' : null,
            notas: null,
          },
          { onConflict: 'sucursal_id,fecha' },
        )
        .select()
        .single()

      if (reporteError || !reporte) {
        console.error(`  ! Error en reporte ${sucursal.nombre} ${fecha}: ${reporteError?.message}`)
        continue
      }

      const lineasVenta = Math.round(randomBetween(3, 7))
      for (let l = 0; l < lineasVenta; l++) {
        const producto = pick(productos)
        await supabase.from('ventas').insert({
          sucursal_id: sucursal.id,
          reporte_id: reporte.id,
          producto_id: producto.id,
          usuario_id: responsableId,
          cantidad: Math.round(randomBetween(1, 12)),
          precio_unitario: producto.precio_venta,
          metodo_pago: pick(['efectivo', 'tarjeta', 'transferencia']),
          fecha,
        })
      }

      if (dias % 3 === 0) {
        await supabase.from('gastos').insert({
          sucursal_id: sucursal.id,
          usuario_id: responsableId,
          categoria_id: categorias?.length ? pick(categorias).id : null,
          monto: randomBetween(150, 900),
          concepto: pick(['Compra de carbón', 'Reparación de equipo', 'Compra de hielo', 'Gas LP', 'Material de limpieza']),
          descripcion: null,
          fecha,
        })
      }
    }

    for (let p = 0; p < 3; p++) {
      const producto = pick(productos)
      await supabase.from('pedidos').insert({
        sucursal_id: sucursal.id,
        producto_id: producto.id,
        usuario_id: responsableId,
        cantidad: Math.round(randomBetween(5, 40)),
        comentario: p === 0 ? 'Urge para el fin de semana' : null,
        prioridad: pick(prioridades),
        estado: pick(estadosPedido),
        fecha: isoDaysAgo(Math.round(randomBetween(0, 5))),
      })
    }

    for (let m = 0; m < 2; m++) {
      const producto = pick(productos)
      await supabase.from('mermas').insert({
        sucursal_id: sucursal.id,
        producto_id: producto.id,
        usuario_id: responsableId,
        cantidad: m === 0 ? Math.round(randomBetween(22, 30)) : Math.round(randomBetween(1, 8)),
        motivo: pick(motivos),
        fecha: isoDaysAgo(Math.round(randomBetween(0, 7))),
        observaciones: null,
      })
    }

    console.log(`  + Datos operativos creados para ${sucursal.nombre}`)
  }

  console.log('\nListo. Cuentas demo (contraseña para todas: ' + DEMO_PASSWORD + '):')
  console.log('  Administrador: admin@pollo.com')
  console.log('  Encargados:    encargado.centro@pollo.com / encargado.norte@pollo.com / encargado.sur@pollo.com')
  console.log('  Empleados:     empleado1@pollo.com / empleado2@pollo.com')
}

main().catch((err) => {
  console.error('\nFalló la siembra de datos demo:', err.message ?? err)
  process.exit(1)
})
