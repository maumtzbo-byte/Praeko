import { randomBytes } from "node:crypto";

/**
 * La liga de aprobación: token, caducidad y lectura por token.
 *
 * Todo lo que toca la tabla `approval_links` pasa por aquí porque hay una
 * regla que no se puede romper en ningún lado: el `business_id` SIEMPRE se
 * resuelve desde el token, nunca se recibe del cliente. La página es
 * pública y sin sesión, así que el token es la única credencial; si alguna
 * consulta aceptara un business_id de fuera, cualquiera podría leer el mes
 * de otra marca con su propia liga válida.
 */

/** 32 bytes en base64url — 256 bits de azar.
 *
 *  No es un uuid a propósito. Un uuid v4 trae 122 bits, que alcanzan de
 *  sobra contra un atacante teórico, pero esta URL va a acabar pegada en
 *  un chat de WhatsApp, reenviada a la contadora y guardada en el
 *  historial de tres teléfonos. Lo que la protege no es su matemática, es
 *  que caduque; y de todos modos 256 bits cuestan exactamente lo mismo de
 *  generar y se ven igual de largos en una URL que ya nadie va a teclear
 *  a mano. */
export function nuevoToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Recorta el token a algo que se pueda enseñar en el panel sin exponerlo
 *  completo en una captura de pantalla. */
export function tokenCorto(token: string): string {
  return `${token.slice(0, 6)}…`;
}

export type EstadoLiga = "vigente" | "caducada" | "inexistente";

export function estadoDeLiga(liga: { expires_at: string } | null): EstadoLiga {
  if (!liga) return "inexistente";
  return new Date(liga.expires_at).getTime() > Date.now() ? "vigente" : "caducada";
}

/** El mes en palabras, para el encabezado de la liga. Se arma con la
 *  fecha de inicio del rango y no con `toLocaleDateString` sobre un `new
 *  Date("2026-10-01")`, porque eso interpreta la cadena como UTC y en
 *  México devuelve el mes anterior la mitad del año. */
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function mesEnPalabras(fechaIso: string): string {
  const [anio, mes] = fechaIso.split("-").map(Number);
  const nombre = MESES[(mes ?? 1) - 1] ?? "";
  return `${nombre} de ${anio}`;
}

/** Formato corto de una fecha del calendario, sin caer en el mismo
 *  problema de zona horaria. */
export function diaCorto(fechaIso: string): string {
  const [, mes, dia] = fechaIso.split("-").map(Number);
  return `${dia} de ${MESES[(mes ?? 1) - 1]?.slice(0, 3) ?? ""}`;
}
