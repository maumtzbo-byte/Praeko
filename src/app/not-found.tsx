import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] px-6 text-center">
      <p className="chrome-text text-7xl font-bold tracking-tight">404</p>
      <h1 className="text-xl font-semibold text-zinc-900">Esta página no existe</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        El enlace que seguiste puede estar roto o la página se movió de lugar.
      </p>
      <Link href="/">
        <Button className="mt-2">Volver al inicio</Button>
      </Link>
    </div>
  );
}
