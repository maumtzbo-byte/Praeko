import Link from "next/link";
import { FramesMark } from "@/components/brand/FramesMark";

const PRODUCT_LINKS = [
  { href: "#agentes", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
];

const ACCOUNT_LINKS = [
  { href: "/login", label: "Iniciar sesión" },
  { href: "/registro", label: "Crear cuenta" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--hairline)]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 text-lg font-semibold tracking-[0.2em] text-zinc-950 dark:text-white">
            <FramesMark className="h-5 w-5" />
            FRAMES
          </span>
          <p className="max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            Marketing con inteligencia, para negocios pequeños en México.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400">PRODUCTO</p>
          {PRODUCT_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400">CUENTA</p>
          {ACCOUNT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <a
            href="mailto:soporte@frames.com"
            className="text-sm text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
          >
            soporte@frames.com
          </a>
        </div>
      </div>

      <div className="border-t border-[var(--hairline)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            &copy; {new Date().getFullYear()} Frames. Todos los derechos reservados.
          </p>
          {/* One more conversion point for whoever scrolls all the way
              down without converting on the way — the rest of the footer
              is informational, not a second ask. */}
          <Link
            href="/registro"
            className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 dark:bg-white dark:text-zinc-950"
          >
            Empieza gratis
          </Link>
        </div>
      </div>
    </footer>
  );
}
