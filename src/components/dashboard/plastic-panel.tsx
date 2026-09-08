import type { CSSProperties, ReactNode } from "react";

/**
 * El plástico mate de la marca, aplicado a un panel del dashboard.
 *
 * No es una caja blanca con borde: es la misma receta que la burbuja de
 * "Tu nuevo equipo" en la landing (ver TeamSection.tsx), que a su vez imita
 * el material de los muñecos 3D. Lo que da el volumen son las tres sombras
 * INTERNAS —filo de luz en el canto de arriba, sombra suave en el de
 * abajo, y un canto de 1px— más el degradado vertical. Un `border: 1px`
 * plano aplana la pieza y la deja pegada encima de la página como un
 * recorte; hay que resistirse a agregarlo.
 *
 * El halo de color de abajo es lo único que cambia entre estados, y ahí es
 * donde vive el color semántico: la pieza brilla del color de lo que le
 * pasa. Ámbar es "te toca a ti", rojo es "se rompió", verde es "ya está".
 * El azul de marca queda para lo neutro y NO significa estado — si el
 * acento también fuera un semáforo, dejarían de leerse los dos.
 */
export type Relieve = "neutro" | "pendiente" | "roto" | "listo";

/** Halo inferior por estado. Alfa bajo a propósito: es luz rebotada en el
 *  piso, no un borde de color. Subirlo convierte el panel en una alerta y
 *  la pantalla completa en un semáforo. */
const HALO: Record<Relieve, string> = {
  neutro: "rgba(61,117,173,0.26)",
  // Los cálidos van más bajos que el azul aunque el número diga lo
  // contrario: sobre el gris frío de la página, un halo rojo o ámbar al
  // mismo alfa se lee como una mancha rosa debajo del panel en vez de como
  // luz rebotada. Medido a ojo contra el azul, no copiado de él.
  pendiente: "rgba(180,83,9,0.17)",
  roto: "rgba(180,35,24,0.16)",
  listo: "rgba(6,118,71,0.17)",
};

export function PlasticPanel({
  relieve = "neutro",
  className = "",
  children,
  style,
}: {
  relieve?: Relieve;
  className?: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`relative rounded-[1.75rem] ${className}`}
      style={{
        background: "linear-gradient(180deg,#ffffff 0%,#fdfdfe 45%,#f2f3f5 100%)",
        boxShadow: [
          "inset 0 1.5px 1px rgba(255,255,255,0.95)",
          "inset 0 -5px 9px rgba(15,23,42,0.07)",
          "inset 0 0 0 1px rgba(15,23,42,0.04)",
          `0 26px 50px -22px ${HALO[relieve]}`,
          "0 12px 26px -16px rgba(15,23,42,0.22)",
        ].join(","),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * El fondo contra el que se apoyan los paneles.
 *
 * Sin esto los paneles flotan sobre un gris plano y el relieve se pierde:
 * una pieza con volumen necesita un espacio con volumen atrás. Son dos
 * capas, las dos fuera del flujo y sin eventos:
 *
 *   1. Un pozo de luz arriba al centro, que hace de fuente luminosa y
 *      explica por qué el filo de arriba de cada panel está iluminado.
 *   2. Un piso apenas más oscuro abajo, donde caen las sombras de
 *      contacto.
 *
 * Se sale del ancho del contenido a propósito (los `-inset`): el borde del
 * degradado nunca debe coincidir con el borde de un panel, porque entonces
 * se lee como una caja más en vez de como profundidad.
 */
export function PlasticStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative isolate ${className}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -inset-y-10 -z-10"
        style={{
          background: [
            "radial-gradient(78% 62% at 50% -12%, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 58%)",
            "radial-gradient(68% 52% at 50% 114%, rgba(15,23,42,0.085) 0%, rgba(15,23,42,0) 56%)",
            // Las esquinas de arriba, apenas hundidas. Es lo que convierte
            // el pozo de luz en luz DIRIGIDA: sin algo más oscuro a los
            // lados, un degradado claro al centro se lee como una mancha
            // blanca y no como una fuente arriba del escenario.
            "radial-gradient(120% 70% at 50% -20%, rgba(15,23,42,0) 55%, rgba(15,23,42,0.045) 100%)",
          ].join(","),
        }}
      />
      {children}
    </div>
  );
}

/**
 * Una pastilla hundida, no levantada. Es la contraparte del panel: el
 * panel sobresale porque se puede tocar, la etiqueta se hunde porque solo
 * se lee. Mantener esa regla es lo que hace que el relieve signifique algo
 * en vez de ser decoración repartida por toda la pantalla.
 */
export function PressedChip({
  tono,
  children,
}: {
  tono: Exclude<Relieve, "neutro"> | "neutro";
  children: ReactNode;
}) {
  const color: Record<Relieve, { texto: string; fondo: string }> = {
    neutro: { texto: "#3f5a75", fondo: "#eef2f6" },
    pendiente: { texto: "#92500a", fondo: "#fdf3e3" },
    roto: { texto: "#a3231a", fondo: "#fcedeb" },
    listo: { texto: "#0a6b4a", fondo: "#e6f4ee" },
  };
  const c = color[tono];
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-[3px] text-[11px] font-semibold tracking-tight"
      style={{
        color: c.texto,
        background: c.fondo,
        boxShadow: "inset 0 1px 2px rgba(15,23,42,0.10), inset 0 -1px 0 rgba(255,255,255,0.85)",
      }}
    >
      {children}
    </span>
  );
}
