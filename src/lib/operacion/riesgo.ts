/**
 * Qué tan cerca está un cliente de irse.
 *
 * El churn es la palanca más fuerte del negocio: bajarlo de 7% a 5% son
 * casi nueve mil pesos más de MRR al mes doce. Y el 43% de las bajas pasa
 * en los primeros 90 días, antes de que el trabajo haya tenido tiempo de
 * dar resultados.
 *
 * Lo que este archivo hace es aprovechar algo que ya estaba pasando y
 * nadie miraba: **un cliente que se va deja rastro antes de avisar**. Deja
 * de abrir las ligas de aprobación, deja de contestar, deja de aprobar
 * piezas. Para cuando lo dice, ya lo decidió hace semanas. Esa ventana
 * anterior es la única donde una llamada sirve de algo.
 *
 * Todas las señales salen de datos que ya se guardaban. No hace falta
 * pedirle nada a nadie.
 */

export type Senal = {
  /** Qué se vio, en una frase, para poder actuar sin investigar. */
  texto: string;
  /** Cuánto pesa. La suma decide el nivel. */
  puntos: number;
};

export type NivelDeRiesgo = "bien" | "ojo" | "urgente";

export type Riesgo = {
  nivel: NivelDeRiesgo;
  senales: Senal[];
  /** Qué hacer hoy. Vacío cuando está bien. */
  quehacer: string | null;
};

export type DatosDeRiesgo = {
  /** Días desde que el cliente contrató. */
  diasDeCliente: number;
  /** Ligas de aprobación mandadas, de la más nueva a la más vieja. */
  ligas: { abierta: boolean; completada: boolean; diasDesde: number }[];
  /** Días desde el último mensaje SUYO. null si nunca ha escrito. */
  diasSinEscribir: number | null;
  /** Piezas publicadas en los últimos 30 días. */
  publicadasUltimoMes: number;
  /** Si tiene algún agregado comprado. */
  tieneAgregado: boolean;
  /** Cuántas piezas tienen medición utilizable. */
  piezasMedidas: number;
};

const UMBRAL_OJO = 3;
const UMBRAL_URGENTE = 6;

/** Los primeros 90 días son donde pasa el 43% de las bajas. Dentro de esa
 *  ventana, las mismas señales pesan más. */
const VENTANA_CRITICA_DIAS = 90;

export function evaluarRiesgo(datos: DatosDeRiesgo): Riesgo {
  const senales: Senal[] = [];
  const enVentanaCritica = datos.diasDeCliente <= VENTANA_CRITICA_DIAS;
  const peso = enVentanaCritica ? 2 : 1;

  // 1. Dejó de abrir las ligas. Es la señal más limpia que hay: la liga es
  //    lo único que le pedimos y abrirla cuesta un clic.
  const sinAbrir = datos.ligas.filter((l) => !l.abierta && l.diasDesde >= 3);
  if (sinAbrir.length >= 2) {
    senales.push({
      texto: `${sinAbrir.length} ligas de aprobación seguidas sin abrir`,
      puntos: 3 * peso,
    });
  } else if (sinAbrir.length === 1 && sinAbrir[0]!.diasDesde >= 7) {
    senales.push({ texto: "La última liga lleva una semana sin abrir", puntos: 2 * peso });
  }

  // 2. Abrió pero no terminó. Entró, vio, y no aprobó nada: o no le
  //    gustó lo que vio, o no entendió qué hacer. Las dos se arreglan
  //    hablando y ninguna se arregla sola.
  const abiertasSinTerminar = datos.ligas.filter(
    (l) => l.abierta && !l.completada && l.diasDesde >= 5,
  );
  if (abiertasSinTerminar.length > 0) {
    senales.push({
      texto: "Abrió la liga y no aprobó nada",
      puntos: 2 * peso,
    });
  }

  // 3. Silencio. Un cliente contento escribe.
  if (datos.diasSinEscribir !== null && datos.diasSinEscribir >= 21) {
    senales.push({
      texto: `${datos.diasSinEscribir} días sin escribir`,
      puntos: 2 * peso,
    });
  }

  // 4. No está saliendo nada. Esto no es culpa de él y es la causa de baja
  //    más fácil de justificar que existe: paga cada mes y su perfil está
  //    igual que antes.
  if (datos.publicadasUltimoMes === 0) {
    senales.push({ texto: "No se le ha publicado nada en 30 días", puntos: 4 });
  } else if (datos.publicadasUltimoMes <= 2) {
    senales.push({ texto: `Solo ${datos.publicadasUltimoMes} publicaciones en 30 días`, puntos: 2 });
  }

  // 5. Un solo producto pasados los tres meses. No es una señal de que se
  //    vaya hoy — es la que mejor predice que se va en dos años.
  if (!datos.tieneAgregado && datos.diasDeCliente > VENTANA_CRITICA_DIAS) {
    senales.push({ texto: "Lleva más de 3 meses con un solo producto", puntos: 1 });
  }

  // 6. Sin resultados que enseñarle. Si nunca se ha medido nada, la
  //    conversación de renovación no tiene con qué defenderse.
  if (datos.piezasMedidas === 0 && datos.publicadasUltimoMes > 0) {
    senales.push({ texto: "Nunca se han medido sus resultados", puntos: 1 });
  }

  const total = senales.reduce((suma, s) => suma + s.puntos, 0);
  const nivel: NivelDeRiesgo =
    total >= UMBRAL_URGENTE ? "urgente" : total >= UMBRAL_OJO ? "ojo" : "bien";

  return { nivel, senales, quehacer: queHacer(nivel, senales, datos) };
}

/** Una sola acción concreta, la más urgente. Una lista de cinco cosas que
 *  podrías hacer es una lista que no se hace. */
function queHacer(nivel: NivelDeRiesgo, senales: Senal[], datos: DatosDeRiesgo): string | null {
  if (nivel === "bien") return null;

  if (datos.publicadasUltimoMes === 0) {
    return "Publícale algo hoy. Lleva un mes pagando sin ver nada suyo salir.";
  }
  if (senales.some((s) => s.texto.includes("sin abrir"))) {
    return "Háblale por WhatsApp, no le remandes la liga. Dos ligas sin abrir no se arreglan con una tercera.";
  }
  if (senales.some((s) => s.texto.includes("no aprobó"))) {
    return "Pregúntale qué no le convenció. Entró a verlas y no aprobó ninguna.";
  }
  if (senales.some((s) => s.texto.includes("sin escribir"))) {
    return "Mándale sus números del mes. Un cliente callado necesita un motivo para volver a hablar.";
  }
  if (senales.some((s) => s.texto.includes("un solo producto"))) {
    return "Ofrécele el agregado de comentarios. Un cliente con dos productos retiene casi el doble.";
  }
  return "Mide sus resultados y mándaselos.";
}
