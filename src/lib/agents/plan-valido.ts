import type { StrategyDayPlan } from "./strategy-script-agent";

/**
 * Deja el plan del agente en condiciones de tocar la base.
 *
 * Entre `callStrategyAgent` y el `insert` no había NADA: `d.date` se iba
 * tal cual a una columna `date` y `d.recommendedPublishTime` a una columna
 * `time`. Las dos son estrictas y las dos venían de texto generado. Tres
 * formas distintas de tirar la corrida COMPLETA después de haber pagado la
 * llamada a Claude:
 *
 *   1. Una fecha que no existe ("2026-02-30") o con otro formato. Postgres
 *      rechaza el insert entero, no la fila.
 *   2. Dos piezas el mismo día con el mismo formato. El upsert va con
 *      `onConflict` y Postgres contesta "ON CONFLICT DO UPDATE command
 *      cannot affect row a second time" — otra vez, el lote completo.
 *   3. Una hora escrita como "18:00 hrs" o "6 PM". Misma historia.
 *
 * Ninguna es rara: son treinta piezas de texto generado por corrida.
 *
 * El criterio al limpiar es quedarse con lo más posible. Una hora que no se
 * entiende se vuelve null (la columna lo acepta y la interfaz ya sabe
 * mostrar una pieza sin hora); solo se tira la pieza cuando la fecha la
 * hace imposible de guardar.
 */

const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Una fecha ISO que además existe de verdad. `new Date("2026-02-30")` no
 *  truena: rueda al 2 de marzo. La única forma de cacharlo es volver a
 *  formatear y comparar. */
function fechaReal(texto: string): boolean {
  if (!ES_FECHA.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

function sumaDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Cuánto se le perdona al modelo por encima del rango pedido. Un día de
 *  más al principio o al final es un error de conteo; una fecha del mes que
 *  viene es que se perdió, y esa sí se tira. */
const HOLGURA_DIAS = 2;

/**
 * Normaliza la hora a "HH:MM" o devuelve null.
 *
 * Acepta lo que el modelo suele escribir de más ("9:00", "18:00:00",
 * "6:00 PM") y se rinde con todo lo demás en vez de adivinar. Guardar null
 * es honesto: dice "no hay hora sugerida", que es justo lo que pasó.
 */
export function horaValida(crudo: unknown): string | null {
  if (typeof crudo !== "string") return null;
  const texto = crudo.trim().toLowerCase();
  if (!texto) return null;

  const m = texto.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?$/);
  if (!m) return null;

  let horas = Number(m[1]);
  const minutos = Number(m[2] ?? "0");
  const meridiano = m[3]?.replace(/\./g, "");

  if (!Number.isInteger(horas) || !Number.isInteger(minutos) || minutos > 59) return null;

  if (meridiano === "pm" && horas < 12) horas += 12;
  if (meridiano === "am" && horas === 12) horas = 0;
  // Sin meridiano, "14" ya viene en 24h y "9" se queda en 9 — no se
  // convierte a las 9 de la noche por corazonada.
  if (horas > 23) return null;

  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

export type PlanLimpio = {
  dias: StrategyDayPlan[];
  /** Cuántas piezas se tiraron y por qué. Va al log, no al usuario: si
   *  esto empieza a salir seguido es señal de que el prompt o el tope de
   *  tokens andan mal, y sin contarlo no hay forma de enterarse. */
  descartadas: { fechaInvalida: number; fueraDeRango: number; repetida: number };
};

export function limpiarPlan(
  dias: StrategyDayPlan[],
  desde: string,
  cuantosDias: number,
): PlanLimpio {
  const descartadas = { fechaInvalida: 0, fueraDeRango: 0, repetida: 0 };

  const primera = sumaDias(desde, -HOLGURA_DIAS);
  const ultima = sumaDias(desde, cuantosDias - 1 + HOLGURA_DIAS);

  const vistas = new Set<string>();
  const limpias: StrategyDayPlan[] = [];

  for (const dia of dias) {
    if (typeof dia?.date !== "string" || !fechaReal(dia.date)) {
      descartadas.fechaInvalida += 1;
      continue;
    }
    if (dia.date < primera || dia.date > ultima) {
      descartadas.fueraDeRango += 1;
      continue;
    }

    // La misma llave con la que el upsert va a chocar contra sí mismo.
    const llave = `${dia.date}|${dia.format}`;
    if (vistas.has(llave)) {
      descartadas.repetida += 1;
      continue;
    }
    vistas.add(llave);

    limpias.push({ ...dia, recommendedPublishTime: horaValida(dia.recommendedPublishTime) });
  }

  return { dias: limpias, descartadas };
}
