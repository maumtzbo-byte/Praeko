import { CheckCircle2, Gem } from "lucide-react";
import { FramesMark } from "@/components/brand/FramesMark";

/** Fixed bar-width pattern for the decorative barcode strip — purely
 * ornamental (ticket motif), never claims to encode or scan anything
 * real, so it's a plain array rather than derived from the customer
 * number in a way that would imply it does. The customer number itself
 * is shown as real text underneath, same role the ticket ID plays on a
 * real receipt. */
const BARCODE_WIDTHS = [2, 1, 1, 3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 1, 2, 1, 4, 1, 2, 1, 3, 1, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 4, 1, 2, 1, 1, 3, 1, 2];

const BARCODE_BAR_GAP = 1.5;

// Positions computed functionally (no mutation during render) — each bar's
// x is the running sum of every prior bar's width + gap.
const BARCODE_BARS = BARCODE_WIDTHS.reduce<{ x: number; width: number }[]>((bars, width) => {
  const previous = bars[bars.length - 1];
  const x = previous ? previous.x + previous.width + BARCODE_BAR_GAP : 0;
  return [...bars, { x, width }];
}, []);
const BARCODE_TOTAL_WIDTH = BARCODE_BARS.reduce((max, bar) => Math.max(max, bar.x + bar.width), 0);

function DecorativeBarcode() {
  return (
    <svg viewBox={`0 0 ${BARCODE_TOTAL_WIDTH} 40`} className="h-10 w-full text-zinc-900" preserveAspectRatio="none" aria-hidden="true">
      {BARCODE_BARS.map((bar, i) => (
        <rect key={i} x={bar.x} y={0} width={bar.width} height={40} fill="currentColor" fillOpacity={i % 3 === 0 ? 0.92 : 0.82} />
      ))}
    </svg>
  );
}

// ── El papel ────────────────────────────────────────────────────────────
//
// Esta pieza es la excepción declarada al plástico del resto del panel, y
// lo es a propósito: un comprobante es de papel. Que sea el único objeto
// con otro material es justo lo que lo hace leerse como un ticket y no
// como una tarjeta más — si también fuera plástico, dejaría de ser un
// recuerdo de algo que pasó y sería otro módulo de la interfaz.

const DIENTES = 23;
const ALTO_DIENTE = 8;

/** El recorte dentado de arriba y abajo, como sale un ticket de la
 *  impresora térmica.
 *
 *  Va con `clip-path` y no con `mask-composite`, que es la receta que uno
 *  encuentra primero: componer tres máscaras depende de un soporte de
 *  navegador que todavía no es parejo, y cuando falla no falla feo —
 *  desaparece la pieza completa. Un polígono calculado se dibuja igual en
 *  todos lados, y además `drop-shadow` lo sigue, cosa que `box-shadow` no
 *  haría (seguiría el rectángulo y la sombra se vería recta debajo de un
 *  borde picudo).
 *
 *  Se calcula en el servidor y sale ya escrito en el HTML: cero JS en el
 *  cliente para esto. */
function bordeDentado(dientes: number, alto: number): string {
  const paso = 100 / dientes;
  const puntos: string[] = [];
  for (let i = 0; i <= dientes; i++) {
    puntos.push(`${(i * paso).toFixed(3)}% ${i % 2 === 0 ? "0px" : `${alto}px`}`);
  }
  for (let i = dientes; i >= 0; i--) {
    puntos.push(`${(i * paso).toFixed(3)}% ${i % 2 === 0 ? "100%" : `calc(100% - ${alto}px)`}`);
  }
  return `polygon(${puntos.join(",")})`;
}

/** Grano del papel. Es una textura generada por el propio navegador
 *  (feTurbulence dentro de un SVG en data URI), no una imagen: no pesa
 *  nada, no se pide por red y no se pixelea al agrandar. Va en muy baja
 *  opacidad — con más, deja de parecer papel y empieza a parecer una
 *  pantalla sucia. */
const GRANO =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>" +
  "<filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/>" +
  "<feColorMatrix type='saturate' values='0'/></filter>" +
  "<rect width='140' height='140' filter='url(%23g)' opacity='0.22'/></svg>\")";

/** Dos dobleces suavísimos, en diagonales distintas y sin simetría entre
 *  sí. Es lo que separa "papel" de "rectángulo beige": una hoja que estuvo
 *  en una bolsa no está perfectamente plana. Más de dos y se ve estropeada
 *  en vez de usada. */
const DOBLECES =
  "linear-gradient(104deg, rgba(15,23,42,0) 39%, rgba(15,23,42,0.016) 41.5%, rgba(255,255,255,0.16) 43%, rgba(15,23,42,0) 46%)," +
  "linear-gradient(78deg, rgba(15,23,42,0) 72%, rgba(15,23,42,0.012) 74%, rgba(255,255,255,0.11) 75.5%, rgba(15,23,42,0) 78%)";

const PAPEL = "linear-gradient(168deg, #f7f6f4 0%, #f1f0ed 46%, #eceae6 100%)";

function LineaPunteada() {
  return <div className="border-t border-dashed border-zinc-400/45" />;
}

function Renglon({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-zinc-500">{etiqueta}</span>
      <span className="font-mono text-[13px] font-medium tabular-nums text-zinc-900">{valor}</span>
    </div>
  );
}

/**
 * El comprobante del mes gratis de beta (grantBetaTrial en
 * src/app/onboarding/actions.ts), hecho como un ticket de compra de
 * verdad: papel térmico con su grano, borde dentado arriba y abajo, datos
 * en monoespaciada alineados a la derecha y el folio bajo el código de
 * barras.
 *
 * Vive aquí y no en components/ui porque esa carpeta es para primitivos
 * genéricos y sin contenido (Button, Card, Badge); este trae copy y datos
 * del negocio.
 *
 * Nada inventado, igual que antes: no hay tarjeta ni últimos 4 dígitos
 * —no existe cobro real todavía, mismo criterio que plan-request-modal—,
 * el código de barras es ornamental y no codifica nada, y la fecha del pie
 * es la de alta de la suscripción, no una hora de impresión simulada.
 */
export function BetaTrialTicket({
  customerNumber,
  planDisplayName,
  trialEndLabel,
  priceUsd,
  issuedAtLabel,
}: {
  customerNumber: number;
  planDisplayName: string;
  trialEndLabel: string;
  priceUsd: number;
  /** Cuándo se otorgó la beta (created_at de la suscripción), ya
   *  formateado. Opcional porque una suscripción vieja podría no traerlo;
   *  sin él, el pie se queda sin fecha en vez de mostrar una fabricada. */
  issuedAtLabel?: string | null;
}) {
  const customerCode = `FRM-${String(customerNumber).padStart(6, "0")}`;

  return (
    <div
      className="animate-fade-in-up mb-6 w-full max-w-[19.5rem]"
      // La sombra va en el envoltorio y no en el papel: `drop-shadow` sí
      // sigue el contorno recortado, y así cae dentada como el borde.
      style={{ filter: "drop-shadow(0 2px 2px rgba(15,23,42,0.10)) drop-shadow(0 20px 26px rgba(15,23,42,0.16))" }}
    >
      <div
        className="px-6 pb-6 pt-8"
        style={{
          clipPath: bordeDentado(DIENTES, ALTO_DIENTE),
          backgroundImage: `${GRANO},${DOBLECES},${PAPEL}`,
        }}
      >
        {/* Encabezado del comercio, como en cualquier ticket: quién lo
            emite a la izquierda, qué es a la derecha. */}
        <div className="flex items-start justify-between gap-3">
          <span className="flex items-center gap-2 text-[15px] font-semibold tracking-[0.22em] text-zinc-900">
            <FramesMark className="h-4 w-4" />
            FRAMES
          </span>
          {/* Partido a mano en dos renglones parejos. Dejándolo fluir, el
              ancho del ticket lo rompía en "Agentes de IA para / negocios"
              y la primera línea quedaba colgando. */}
          <span className="shrink-0 text-right text-[11px] leading-[1.35] text-zinc-500">
            Agentes de IA
            <br />
            para negocios
          </span>
        </div>

        <div className="my-4">
          <LineaPunteada />
        </div>

        <div className="flex flex-col items-center text-center">
          <span className="text-accent">
            <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} />
          </span>
          <h3 className="mt-2.5 text-[19px] font-semibold leading-tight text-zinc-900">¡Bienvenido a la beta!</h3>
          <p className="mt-1 text-[13px] text-zinc-500">Tu primer mes de Frames es gratis.</p>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <Renglon etiqueta="Cliente" valor={`#${customerNumber}`} />
          <Renglon etiqueta="Valor regalado" valor={`$${priceUsd.toFixed(0)} USD`} />
          <Renglon etiqueta="Válido hasta" valor={trialEndLabel} />
        </div>

        <div className="my-4">
          <LineaPunteada />
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Gem className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-zinc-900">Plan {planDisplayName}</p>
            <p className="text-[13px] leading-snug text-zinc-500">Activado automáticamente, sin tarjeta.</p>
          </div>
        </div>

        <div className="my-4">
          <LineaPunteada />
        </div>

        <DecorativeBarcode />
        <p className="mt-2 text-center font-mono text-[13px] tracking-[0.22em] text-zinc-800">{customerCode}</p>

        <div className="my-4">
          <LineaPunteada />
        </div>

        <div className="flex items-end justify-between gap-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-zinc-500">
          <span className="max-w-[9rem]">Gracias por ser parte de Frames</span>
          {issuedAtLabel && <span className="shrink-0 text-right">{issuedAtLabel}</span>}
        </div>
      </div>
    </div>
  );
}
