// Tipos generados a mano a partir de supabase/migrations/0001_init_schema.sql
// Si conectas un proyecto Supabase real, puedes regenerarlos con:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type RolClave = 'administrador' | 'encargado' | 'empleado'
export type EstadoSucursal = 'activa' | 'inactiva'
export type EstadoUsuario = 'activo' | 'inactivo'
export type UnidadProducto = 'pieza' | 'kg' | 'g' | 'litro' | 'ml' | 'paquete' | 'caja' | 'bolsa'
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'
export type PrioridadPedido = 'baja' | 'normal' | 'alta' | 'urgente'
export type EstadoPedido = 'pendiente' | 'aceptado' | 'en_preparacion' | 'enviado' | 'recibido' | 'cancelado'
export type MotivoMerma = 'caducidad' | 'dano_fisico' | 'mal_manejo' | 'transporte' | 'refrigeracion' | 'otro'
export type TipoNotificacion =
  | 'reporte_faltante'
  | 'inventario_bajo'
  | 'merma_alta'
  | 'pedido_pendiente'
  | 'pedido_actualizado'
  | 'general'

export interface Rol {
  id: number
  clave: RolClave
  nombre: string
  descripcion: string | null
  created_at: string
}

export interface Sucursal {
  id: string
  nombre: string
  direccion: string
  telefono: string | null
  responsable: string | null
  estado: EstadoSucursal
  created_at: string
  updated_at: string
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol_id: number
  sucursal_id: string | null
  estado: EstadoUsuario
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface UsuarioConRelaciones extends Usuario {
  rol: Rol
  sucursal: Sucursal | null
}

export interface Categoria {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
}

export interface Producto {
  id: string
  nombre: string
  categoria_id: string | null
  unidad: UnidadProducto
  precio_venta: number
  costo: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface ProductoConCategoria extends Producto {
  categoria: Categoria | null
}

export interface Inventario {
  id: string
  sucursal_id: string
  producto_id: string
  cantidad_actual: number
  stock_minimo: number
  costo_unitario: number
  updated_at: string
  created_at: string
}

export interface InventarioConProducto extends Inventario {
  producto: Producto
}

export interface ReporteDiario {
  id: string
  sucursal_id: string
  usuario_id: string
  fecha: string
  ventas_efectivo: number
  ventas_tarjeta: number
  ventas_transferencia: number
  gastos_total: number
  pollos_recibidos: number
  pollos_vendidos: number
  productos_danados: number
  merma_total: number
  observaciones: string | null
  notas: string | null
  ventas_totales: number
  ganancia_estimada: number
  created_at: string
  updated_at: string
}

export interface Venta {
  id: string
  sucursal_id: string
  reporte_id: string | null
  producto_id: string
  usuario_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  metodo_pago: MetodoPago
  fecha: string
  created_at: string
}

export interface Gasto {
  id: string
  sucursal_id: string
  usuario_id: string
  categoria_id: string | null
  monto: number
  concepto: string
  descripcion: string | null
  fecha: string
  comprobante_url: string | null
  created_at: string
}

export interface Pedido {
  id: string
  sucursal_id: string
  producto_id: string
  usuario_id: string
  cantidad: number
  comentario: string | null
  prioridad: PrioridadPedido
  estado: EstadoPedido
  fecha: string
  created_at: string
  updated_at: string
}

export interface PedidoConRelaciones extends Pedido {
  producto: Producto
  sucursal: Sucursal
}

export interface Merma {
  id: string
  sucursal_id: string
  producto_id: string
  usuario_id: string
  cantidad: number
  motivo: MotivoMerma
  fecha: string
  observaciones: string | null
  created_at: string
}

export interface MermaConProducto extends Merma {
  producto: Producto
}

export interface Notificacion {
  id: string
  usuario_id: string | null
  sucursal_id: string | null
  tipo: TipoNotificacion
  titulo: string
  mensaje: string
  leida: boolean
  link: string | null
  created_at: string
}

export interface HistorialCambio {
  id: string
  tabla: string
  registro_id: string
  accion: 'crear' | 'actualizar' | 'eliminar'
  usuario_id: string | null
  sucursal_id: string | null
  datos_previos: Record<string, unknown> | null
  datos_nuevos: Record<string, unknown> | null
  created_at: string
}
