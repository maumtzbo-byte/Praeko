import { CheckCircle2, Gem } from "lucide-react";

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
    <svg viewBox={`0 0 ${BARCODE_TOTAL_WIDTH} 40`} className="h-9 w-full text-zinc-900" preserveAspectRatio="none" aria-hidden="true">
      {BARCODE_BARS.map((bar, i) => (
        <rect key={i} x={bar.x} y={0} width={bar.width} height={40} fill="currentColor" fillOpacity={i % 3 === 0 ? 0.9 : 0.35} />
      ))}
    </svg>
  );
}

function PerforatedDivider() {
  return (
    <div className="relative -mx-6">
      <div className="border-t border-dashed border-zinc-200" />
      <span className="absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--background)]" />
      <span className="absolute right-0 top-1/2 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--background)]" />
    </div>
  );
}

/**
 * Compact "ticket" confirmation for the free beta month (grantBetaTrial in
 * src/app/onboarding/actions.ts) — the visual grammar of a purchase
 * ticket (centered checkmark badge, bold confirmation headline,
 * perforated dashed dividers, a decorative barcode) in Frames' own light
 * palette, sized to be fully visible in one glance on the plan page, no
 * scrolling. Lives here rather than in components/ui — that folder is for
 * generic, content-free primitives (Button, Card, Badge); this one is
 * Frames-specific copy and business data (customer number, plan, trial
 * dates), so it belongs with the rest of the dashboard's feature
 * components, not the shared UI kit.
 *
 * No fabricated payment details: unlike a real receipt this never shows a
 * card/last-4 (there's no real payment yet — same reasoning as
 * plan-request-modal.tsx), and the barcode is decorative only, not an
 * encoding of real data. Entrance animation reuses globals.css's
 * fade-in-up keyframe (same one the rest of the dashboard uses) instead
 * of pulling in a new animation dependency — this is a server component,
 * so a plain CSS animation runs with zero client JS.
 */
export function BetaTrialTicket({
  customerNumber,
  planDisplayName,
  trialEndLabel,
  priceUsd,
}: {
  customerNumber: number;
  planDisplayName: string;
  trialEndLabel: string;
  priceUsd: number;
}) {
  const customerCode = `FRM-${String(customerNumber).padStart(6, "0")}`;

  return (
    <div className="animate-fade-in-up relative mb-6 w-full max-w-xs rounded-[28px] border border-zinc-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_24px_48px_-24px_rgba(0,0,0,0.16)]">
      <div className="flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CheckCircle2 className="h-6 w-6" strokeWidth={2} />
        </span>
        <h3 className="mt-3 text-lg font-semibold leading-tight text-zinc-900">¡Bienvenido a la beta!</h3>
        <p className="mt-1 text-xs text-zinc-500">Tu primer mes de Frames es gratis</p>
      </div>

      <div className="my-5">
        <PerforatedDivider />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-left">
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-zinc-400">CLIENTE</p>
          <p className="mt-0.5 font-mono text-base font-semibold text-zinc-900">#{customerNumber}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-zinc-400">VALOR REGALADO</p>
          <p className="mt-0.5 text-base font-semibold text-zinc-900">${priceUsd.toFixed(0)} USD</p>
        </div>
        <div className="col-span-2">
          <p className="text-[10px] font-semibold tracking-wide text-zinc-400">VÁLIDO HASTA</p>
          <p className="mt-0.5 text-base font-semibold text-zinc-900">{trialEndLabel}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-zinc-50 p-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-accent shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <Gem className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900">Plan {planDisplayName}</p>
          <p className="text-xs text-zinc-500">Activado automáticamente, sin tarjeta</p>
        </div>
      </div>

      <div className="my-5">
        <PerforatedDivider />
      </div>

      <DecorativeBarcode />
      <p className="mt-2 text-center text-[11px] tracking-[0.25em] text-zinc-400">{customerCode}</p>
    </div>
  );
}
