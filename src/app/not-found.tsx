import Link from "next/link";
import { Button } from "@/components/ui/button";
import AuroraBackground from "@/components/marketing/AuroraBackground";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-[var(--background)] px-6 text-center">
      <AuroraBackground />
      {/* One positioned wrapper around all the content, not `relative` on
          each line individually — AuroraBackground and any single
          `relative` sibling paint in DOM order in the same "positioned
          descendants" layer, which is painted after plain non-positioned
          siblings regardless of who comes first in the markup. Wrapping
          everything once sidesteps that instead of relying on it. */}
      <div className="relative flex flex-col items-center gap-4">
        <p className="aurora-text text-7xl font-bold tracking-tight">404</p>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">Esta página no existe</h1>
        <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          El enlace que seguiste puede estar roto o la página se movió de lugar.
        </p>
        <Link href="/">
          <Button className="mt-2">Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
