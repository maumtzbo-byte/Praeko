import { CheckCircle2 } from "lucide-react";

/**
 * Compact "ticket" confirmation for the free beta month (grantBetaTrial in
 * src/app/onboarding/actions.ts) — everything visible in one glance, no
 * scrolling, unlike a full receipt-style confirmation screen. The
 * perforated-edge look is a pure CSS cutout (two circles matching the
 * page background, centered on the card's own edge via -mx-5 + translate,
 * not fixed pixel offsets) — no fabricated barcode or fake transaction
 * data, just the real numbers: customer number, plan, trial end date,
 * value gifted.
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
  return (
    <div className="relative mb-6 w-full max-w-sm rounded-3xl bg-zinc-950 p-5 text-white shadow-[0_20px_50px_-24px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
          <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-sm font-semibold leading-tight">Bienvenido a la beta</p>
          <p className="text-xs text-zinc-400">Tu primer mes es gratis</p>
        </div>
      </div>

      <div className="relative my-4 -mx-5">
        <div className="border-t border-dashed border-white/15" />
        <span className="absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--background)]" />
        <span className="absolute right-0 top-1/2 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--background)]" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-zinc-500">CLIENTE</p>
          <p className="mt-0.5 font-mono text-sm font-semibold">#{customerNumber}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-zinc-500">PLAN</p>
          <p className="mt-0.5 text-sm font-semibold">{planDisplayName}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-zinc-500">VÁLIDO HASTA</p>
          <p className="mt-0.5 text-sm font-semibold">{trialEndLabel}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold tracking-wide text-zinc-500">VALOR REGALADO</p>
          <p className="mt-0.5 text-sm font-semibold">${priceUsd.toFixed(0)} USD</p>
        </div>
      </div>
    </div>
  );
}
