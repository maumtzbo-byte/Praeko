/**
 * Agente de Tendencias / Fechas Clave: a static commercial calendar for
 * Mexico that gets folded into the strategy agent's prompt so content
 * naturally times itself around dates a small business actually cares
 * about, instead of relying on the dueño to remember and ask for it.
 *
 * Split into fixed-date and variable-date entries. Variable ones (Buen Fin,
 * Hot Sale, Día del Padre, Cyber Monday) don't fall on the same calendar day
 * every year — the dates below are computed from well-known rules (nth
 * weekday of a month) which get the *window* right, but retailer-specific
 * campaigns (Hot Sale, Buen Fin) are ultimately announced by AMVO/CCE each
 * year and can shift by a few days from the computed estimate. Treat these
 * as "content should start thinking about this week", not a legal date.
 */
import { type KeyDate, nthWeekdayOfMonth } from "./key-date-utils";

export type { KeyDate };

interface FixedKeyDate {
  month: number; // 1-12
  day: number;
  name: string;
  angle: string;
}

const FIXED_KEY_DATES: FixedKeyDate[] = [
  { month: 1, day: 1, name: "Año Nuevo", angle: "cierres/aperturas de año, propósitos, tablas de precios nuevas" },
  { month: 1, day: 6, name: "Día de Reyes", angle: "regalos, rosca de reyes, última oportunidad de temporada navideña" },
  { month: 2, day: 14, name: "Día del Amor y la Amistad", angle: "regalos, experiencias en pareja, promociones para dos" },
  { month: 3, day: 8, name: "Día Internacional de la Mujer", angle: "reconocimiento, promociones dirigidas a mujeres" },
  { month: 4, day: 30, name: "Día del Niño", angle: "productos/experiencias para niños, promociones familiares" },
  { month: 5, day: 1, name: "Día del Trabajo", angle: "negocio cerrado o con horario especial, agradecimiento al equipo" },
  { month: 5, day: 10, name: "Día de las Madres", angle: "regalos, experiencias, uno de los picos de venta más fuertes del año en México" },
  { month: 8, day: 27, name: "Regreso a clases", angle: "productos/servicios escolares, promociones de temporada (ventana aprox. últimos días de agosto)" },
  { month: 9, day: 15, name: "Independencia (Grito)", angle: "fiestas patrias, ambientación tricolor, cierres/horarios especiales" },
  { month: 9, day: 16, name: "Día de la Independencia", angle: "fiestas patrias, desfiles, consumo local" },
  { month: 11, day: 1, name: "Día de Todos los Santos", angle: "ambientación de temporada" },
  { month: 11, day: 2, name: "Día de Muertos", angle: "ofrendas, pan de muerto, ambientación mexicana muy compartible en redes" },
  { month: 12, day: 12, name: "Día de la Virgen de Guadalupe", angle: "tradición, peregrinaciones, consumo religioso/familiar" },
  { month: 12, day: 16, name: "Inicio de posadas", angle: "temporada navideña, reuniones, ponche y piñatas" },
  { month: 12, day: 24, name: "Nochebuena", angle: "última oportunidad de compra navideña, horario especial" },
  { month: 12, day: 31, name: "Fin de año", angle: "cierre de año, agradecimiento a clientes, balance del negocio" },
];

/** Variable-date commercial windows, computed per year. See module comment
 * on why these are estimates, not official dates. */
function variableKeyDatesForYear(year: number): KeyDate[] {
  // Hot Sale (AMVO): historically the last week of May — approximated as
  // the Monday of the week containing May 27.
  const hotSaleStart = nthWeekdayOfMonth(year, 5, 1, 4); // 4th Monday of May

  // Buen Fin: officially the weekend anchored around November 16-18,
  // recent years run Friday-Monday of the third full week of November.
  const buenFinStart = nthWeekdayOfMonth(year, 11, 5, 3); // 3rd Friday of Nov

  // Día del Padre: third Sunday of June.
  const diaDelPadre = nthWeekdayOfMonth(year, 6, 0, 3);

  // Cyber Monday MX: Monday following Buen Fin's weekend.
  const cyberMonday = new Date(buenFinStart);
  cyberMonday.setUTCDate(cyberMonday.getUTCDate() + 3);

  return [
    {
      date: hotSaleStart.toISOString().slice(0, 10),
      name: "Hot Sale",
      angle: "descuentos fuertes, uno de los eventos de e-commerce más grandes del año en México",
      approximate: true,
    },
    {
      date: buenFinStart.toISOString().slice(0, 10),
      name: "Buen Fin",
      angle: "el evento de descuentos más grande del año en México — arranca fin de semana, dura varios días",
      approximate: true,
    },
    {
      date: cyberMonday.toISOString().slice(0, 10),
      name: "Cyber Monday",
      angle: "cierre digital del Buen Fin, ofertas exclusivas en línea",
      approximate: true,
    },
    {
      date: diaDelPadre.toISOString().slice(0, 10),
      name: "Día del Padre",
      angle: "regalos, experiencias, promociones para papás",
      approximate: true,
    },
  ];
}

/** Quincena (payday) — the 15th and last day of every month, when Mexican
 * consumer spending predictably spikes. Not a "holiday" content angle by
 * itself, but relevant for recommending promo timing. */
function quincenasForMonth(year: number, month: number): KeyDate[] {
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return [
    {
      date: new Date(Date.UTC(year, month - 1, 15)).toISOString().slice(0, 10),
      name: "Quincena",
      angle: "pico de gasto de consumo — buen momento para promociones",
      approximate: false,
    },
    {
      date: new Date(Date.UTC(year, month - 1, lastDay)).toISOString().slice(0, 10),
      name: "Quincena",
      angle: "pico de gasto de consumo — buen momento para promociones",
      approximate: false,
    },
  ];
}

/** All key dates (fixed + variable + quincenas) falling within
 * [startDate, startDate + days), inclusive of the start day. Spans year
 * boundaries correctly since campaigns/content plans can run up to 30 days. */
export function getUpcomingMexicoKeyDates(startDate: string, days: number): KeyDate[] {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + days);

  const years = new Set([start.getUTCFullYear(), end.getUTCFullYear()]);
  const candidates: KeyDate[] = [];

  for (const year of years) {
    for (const fixed of FIXED_KEY_DATES) {
      candidates.push({
        date: new Date(Date.UTC(year, fixed.month - 1, fixed.day)).toISOString().slice(0, 10),
        name: fixed.name,
        angle: fixed.angle,
        approximate: false,
      });
    }
    candidates.push(...variableKeyDatesForYear(year));
    for (let month = 1; month <= 12; month++) {
      candidates.push(...quincenasForMonth(year, month));
    }
  }

  return candidates
    .filter((d) => {
      const t = new Date(`${d.date}T00:00:00Z`).getTime();
      return t >= start.getTime() && t < end.getTime();
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}
