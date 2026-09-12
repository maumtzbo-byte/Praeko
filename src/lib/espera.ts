/**
 * Le pone techo a una espera.
 *
 * Nació en la pantalla de aprobación: le piqué al botón con la base de
 * datos inalcanzable esperando ver un error, y lo que vi fue un botón
 * girando a los seis segundos, y a los veinte, sin decir nada. La acción
 * no falla — se cuelga. supabase-js no trae tiempo límite en su fetch, así
 * que una base lenta o inalcanzable deja la promesa pendiente para siempre
 * y con ella el estado de "guardando".
 *
 * Un try/catch no alcanza para eso: no hay nada que atrapar.
 *
 * Vive aquí y no dentro de un componente porque el segundo lugar que lo
 * necesitó fue la subida de fotos de /prueba, y copiarlo habría dejado dos
 * definiciones del mismo número que después se desincronizan.
 */

/** 20 segundos: tiene que aguantar un teléfono con mala señal sin cortarle
 *  a alguien que sí iba a recibir respuesta. */
export const LIMITE_MS = 20_000;

export class SeVencio extends Error {}

export function conLimite<T>(promesa: Promise<T>, ms: number = LIMITE_MS): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<never>((_, rechazar) => setTimeout(() => rechazar(new SeVencio()), ms)),
  ]);
}

/**
 * El mensaje que le toca a un fallo de red.
 *
 * Al vencerse dice que PUEDE no haberse guardado, no que falló: el
 * servidor pudo haber escrito y perdido la respuesta de regreso. Prometer
 * que no se guardó sería adivinar.
 */
export function mensajeDeEspera(err: unknown, alVencerse: string): string {
  return err instanceof SeVencio
    ? alVencerse
    : "No se pudo guardar. Revisa tu señal y vuelve a intentar.";
}
