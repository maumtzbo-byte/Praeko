import Link from "next/link";

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
          <span className="text-lg font-semibold tracking-[0.2em] text-zinc-950">PRAEKO</span>
          <p className="max-w-xs text-sm text-zinc-500">
            Marketing con inteligencia, para negocios pequeños en México.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">PRODUCTO</p>
          {PRODUCT_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-zinc-600 transition-colors hover:text-zinc-950">
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">CUENTA</p>
          {ACCOUNT_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-zinc-600 transition-colors hover:text-zinc-950">
              {link.label}
            </Link>
          ))}
          <a href="mailto:soporte@praeko.com" className="text-sm text-zinc-600 transition-colors hover:text-zinc-950">
            soporte@praeko.com
          </a>
        </div>
      </div>

      <div className="border-t border-[var(--hairline)]">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-zinc-400 sm:text-left">
          &copy; {new Date().getFullYear()} Praeko. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
