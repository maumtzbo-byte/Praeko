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
        // La receta base vive en globals.css (--plastico y
        // --relieve-panel), compartida con Card y los botones. Aquí solo
        // se le suma el halo de color, que es lo único propio de estos
        // paneles.
        background: "var(--plastico)",
        boxShadow: `var(--relieve-panel), 0 26px 50px -22px ${HALO[relieve]}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Un escenario local, más marcado que el del shell.
 *
 * El fondo con profundidad ya lo pinta `<main>` para todo el dashboard
 * (ver dashboard-shell.tsx). Esto lo repite sobre un grupo concreto para
 * subrayarlo — la clase `escenario` de globals.css se apila, así que dos
 * capas dan un pozo de luz más cerrado alrededor de estos dos paneles, que
 * son los primeros de la pantalla.
 */
export function PlasticStage({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`escenario relative isolate ${className}`}>
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
