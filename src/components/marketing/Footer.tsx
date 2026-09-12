import Link from "next/link";
import { FramesMark } from "@/components/brand/FramesMark";
import { ligaWhatsapp, MENSAJE_SOPORTE, WHATSAPP_VISIBLE } from "@/lib/contacto";

const PRODUCT_LINKS = [
  { href: "#agentes", label: "Cómo funciona" },
  { href: "#precios", label: "Precios" },
];

// Sin "Crear cuenta". La ruta /registro sigue existiendo para cuando
// abra el autoservicio, pero anunciarla aquí manda a alguien a darse de
// alta solo en un producto que hoy se contrata hablando — y lo que
// encuentra del otro lado no es lo que la página le acaba de prometer.
// "Iniciar sesión" se queda: los clientes que ya tienen panel entran por
// ahí.
const ACCOUNT_LINKS = [{ href: "/login", label: "Iniciar sesión" }];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--hairline)]">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <span className="flex items-center gap-2 text-lg font-semibold tracking-[0.2em] text-zinc-950">
            <FramesMark className="h-5 w-5" />
            FRAMES
          </span>
          <p className="max-w-xs text-sm text-zinc-500">
            Video y escenas de tu producto, cada mes, para marcas mexicanas que venden en línea.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">PRODUCTO</p>
          {PRODUCT_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-950 "
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500">CONTACTO</p>
          {ACCOUNT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 transition-colors hover:text-zinc-950 "
            >
              {link.label}
            </Link>
          ))}
          {/* Era mailto:soporte@frames.com — un dominio que no es
              nuestro. Ver MENSAJE_SOPORTE en src/lib/contacto.ts. */}
          <a
            href={ligaWhatsapp(MENSAJE_SOPORTE)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-600 transition-colors hover:text-zinc-950 "
          >
            WhatsApp {WHATSAPP_VISIBLE}
          </a>
        </div>
      </div>

      <div className="border-t border-[var(--hairline)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-6 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
            <p className="text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} Frames. Todos los derechos reservados.
            </p>
            <div className="flex gap-3">
              <Link href="/privacidad" className="text-xs text-zinc-400 hover:text-zinc-600 ">
                Privacidad
              </Link>
              <Link href="/terminos" className="text-xs text-zinc-400 hover:text-zinc-600 ">
                Términos
              </Link>
            </div>
          </div>
          {/* One more conversion point for whoever scrolls all the way
              down without converting on the way — the rest of the footer
              is informational, not a second ask. */}
          <Link
            href="/prueba"
            className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 "
          >
            Ver mis 3 piezas
          </Link>
        </div>
      </div>
    </footer>
  );
}
