import { createClient } from "@/lib/supabase/server";

/**
 * Quién puede ver la operación interna.
 *
 * Los prospectos de /prueba NO pertenecen a ningún negocio: son el embudo
 * de Frames, no el contenido de un cliente. Por eso esta pantalla no puede
 * vivir bajo /dashboard, que está montado sobre la membresía a un negocio
 * — meterla ahí le enseñaría a cada cliente la lista de todos los demás
 * prospectos.
 *
 * El control es una lista de correos en una variable de entorno. No es
 * elegante y es exactamente lo que corresponde al tamaño del problema: hay
 * una persona operando esto. Un sistema de roles con tablas y políticas
 * sería más código del que vale, y código de permisos que nadie ejercita
 * es código de permisos que no funciona el día que importa.
 *
 * Cuando haya un equipo, esto se cambia por un rol de verdad. Mientras
 * tanto vive en un solo lugar, para que ese cambio toque un archivo.
 */
export async function esOperador(): Promise<boolean> {
  const permitidos = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  // Sin la variable configurada, nadie entra. Falla cerrado a propósito:
  // un despliegue donde se olvidó la variable debe negar el acceso, no
  // abrirlo.
  if (permitidos.length === 0) return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const correo = user?.email?.toLowerCase();
  return Boolean(correo && permitidos.includes(correo));
}
